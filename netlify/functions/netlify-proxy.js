import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';

function processMovieDataFromHtml(html) {
  const $ = cheerio.load(html);
  const movies = [];

  // Extract user's name from title and clean it up
  // Format is "&lrm;Bob's film diary • Letterboxd"
  const pageTitle = $('title').text().trim();
  let name = pageTitle.split('’')[0].trim();
  name = name.substring(1);

  // Extract profile picture URL and modify for larger size
  // If they haven't set a profile picture, we return null and the app can use a placeholder
  let profilePicUrl = $('.profile-mini-person .avatar img').attr('src');
  if (profilePicUrl && profilePicUrl.includes('-0-48-0-48-crop')) {
    profilePicUrl = profilePicUrl.replace('-0-48-0-48-crop', '-0-220-0-220-crop');
  } else {
    profilePicUrl = null;
  }

  $('tr.diary-entry-row').each((_, row) => {
    const $row = $(row);

    // Extract the film div where data attributes are stored
    const $filmDiv = $row.find('td.td-film-details div[data-film-id]');

    // Extract the film ID and film slug
    const filmId = $filmDiv.attr('data-film-id') ? $filmDiv.attr('data-film-id').trim() : null;
    const filmSlug = $filmDiv.attr('data-film-slug') ? stripYearFromSlug($filmDiv.attr('data-film-slug').trim()) : null;

    // Extract the movie title from the h3 element
    const title = $row.find('td.td-film-details h3.headline-3 a').text().trim();

    // Construct the poster URL slug from the filmId
    let posterUrl = null;
    if (filmId && filmSlug) {
      const idDigits = filmId.split('');
      const path = idDigits.join('/');
      posterUrl = `https://a.ltrbxd.com/resized/film-poster/${path}/${filmId}-${filmSlug}-0-300-0-450-crop.jpg`;
    }

    // Attempt to grab the img src property inside the film div
    let test_poster_url = null;
    const imgSrc = $filmDiv.find('img').attr('src');
    if (imgSrc) {
      test_poster_url = imgSrc;
    }

    // Extract and reconstruct the watch date from the URL
    let watchDate = null;
    const dateUrl = $row.find('td.td-day a').attr('href');
    if (dateUrl) {
      const dateParts = dateUrl.split('/').filter(Boolean);
      const forIndex = dateParts.indexOf('for');
      if (forIndex !== -1 && dateParts.length > forIndex + 3) {
        const year = dateParts[forIndex + 1];
        const month = dateParts[forIndex + 2];
        const day = dateParts[forIndex + 3];
        watchDate = new Date(`${year}-${month}-${day}`);
      }
    }

    // Extract the star rating
    let rating = null;
    const ratingValue = $row.find('td.td-rating input.rateit-field').attr('value');
    if (ratingValue !== undefined) {
      rating = parseInt(ratingValue, 10);
    }

    // Determine if the movie is liked
    const isLiked = $row.find('td.td-like .icon-liked').length > 0;

    // Construct the movie object
    movies.push({ filmId, title, posterUrl, test_poster_url, watchDate, rating, isLiked });
  });

  return { movies, name, profilePicUrl };
}

// Helper function to strip the year from the slug to get the correct poster URL
function stripYearFromSlug(slug) {
  if (slug && slug.length >= 5) {
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex !== -1) {
      const possibleYear = slug.slice(lastHyphenIndex + 1);
      if (possibleYear.length === 4 && !isNaN(possibleYear)) {
        return slug.slice(0, lastHyphenIndex);
      }
    }
  }
  return slug;
}

export async function handler(event) {

  if (!event.queryStringParameters || !event.queryStringParameters.url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No URL provided" }),
    };
  }

  const { url } = event.queryStringParameters;

  console.log('Server received URL:', url);

  // Disallow proxying to arbitrary URLs
  if (!url || !url.startsWith("https://letterboxd.com/")) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid URL" }),
      };
  }

  const userAgent = new UserAgent({ deviceCategory: 'desktop' });

  try {
      const response = await fetch(url, {
          headers: {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate, br, zstd',
              'Accept-Language': 'en-US,en;q=0.5',
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Priority': 'u=1, i',
              'Referer': 'https://letterboxd.com/',
              'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"macOS"',
              'User-Agent': userAgent.toString(),
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
          }
      });

      const data = await response.text();
      const { movies, name, profilePicUrl } = processMovieDataFromHtml(data);

      return {
        statusCode: response.status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ movies, name, profilePicUrl }),
    };
  } catch (e) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: `Failed to fetch data: ${e}` }),
      };
  }
}
