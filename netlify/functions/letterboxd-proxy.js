import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';

// Synthetic headers to mimic a real browser for Letterboxd scraping
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const LETTERBOXD_HEADERS = {
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

// Helper function to extract page count from Letterboxd HTML
function getPageCountFromHtml(html) {
  const $ = cheerio.load(html);
  // Find the last page number by looking at the last .paginate-page that contains a number
  const lastPageElement = $('.paginate-pages li.paginate-page:last-child a');
  const pageCount = lastPageElement.length ? parseInt(lastPageElement.text(), 10) : 1;
  console.log('pageCount', pageCount);
  return pageCount;
}

// Helper function to extract user data from Letterboxd HTML
function getUserDataFromHtml(html) {
  const $ = cheerio.load(html);

  // Extract user's name from title and clean it up
  // Format is: "&lrm;Bob's film diary • Letterboxd"
  const pageTitle = $('title').text().trim();
  let name = pageTitle.split('’')[0].trim();
  name = name.substring(1);

  // Extract profile picture URL and modify URL to get a larger size
  // If they haven't set a profile picture, we return null and the app can use a placeholder
  let profilePicUrl = $('.profile-mini-person .avatar img').attr('src');
  if (profilePicUrl && profilePicUrl.includes('-0-48-0-48-crop')) {
    profilePicUrl = profilePicUrl.replace('-0-48-0-48-crop', '-0-220-0-220-crop');
  } else {
    profilePicUrl = null;
  }

  return { name, profilePicUrl };
}

// Helper function to extract structured movie data from Letterboxd HTML
function getMovieDataFromHtml(html) {
  const $ = cheerio.load(html);
  const movies = [];

  $('li.poster-container').each((_, row) => {
    const $row = $(row);

    // Extract the film div where data attributes are stored
    const $filmDiv = $row.find('div.film-poster');

    // Extract the film ID and film slug
    const filmId = $filmDiv.attr('data-film-id') ? $filmDiv.attr('data-film-id').trim() : null;
    const filmSlug = $filmDiv.attr('data-film-slug') ? stripYearFromSlug($filmDiv.attr('data-film-slug').trim()) : null;
    const title = $filmDiv.find('img').attr('alt')?.trim() || null;

    // Construct the poster URL slug from the filmId
    let posterUrl = null;
    if (filmId && filmSlug) {
      const idDigits = filmId.split('');
      const path = idDigits.join('/');
      posterUrl = `https://a.ltrbxd.com/resized/film-poster/${path}/${filmId}-${filmSlug}-0-300-0-450-crop.jpg`;
    }

    // Extract rating from the class. It will look like "rated-5"
    let rating = null;
    const ratingSpan = $row.find('.poster-viewingdata .rating');

    if (ratingSpan.length) {
      const ratingClass = ratingSpan.attr('class').match(/rated-(\d+)/);
      if (ratingClass && ratingClass[1]) {
        rating = parseInt(ratingClass[1], 10);
      }
    }

    // Check for liked status by looking for icon-liked class
    const isLiked = $row.find('.poster-viewingdata .like.icon-liked').length > 0;

    // Construct the movie object
    movies.push({ filmId, title, posterUrl, rating, isLiked });
  });

  return { movies };
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

  try {
      const firstPageResponse = await fetch(url, {
          headers: LETTERBOXD_HEADERS
      });

      const firstPageHtml = await firstPageResponse.text();

      const pageCount = getPageCountFromHtml(firstPageHtml);
      const { name, profilePicUrl } = getUserDataFromHtml(firstPageHtml);
      const { movies } = getMovieDataFromHtml(firstPageHtml);

      // Prepare URLs for paginated requests
      const pageUrls = [];
      for (let i = 2; i <= pageCount; i++) {
        pageUrls.push(`${url}page/${i}/`);
      }

      // Fetch all additional pages concurrently
      const paginatedMovies = await Promise.all(
        pageUrls.map(pageUrl => 
          fetch(pageUrl, { headers: LETTERBOXD_HEADERS })
            .then(res => res.text())
            .then(html => getMovieDataFromHtml(html))
        )
      );

      // Combine all movies from all pages
      const allMovies = [
        ...movies,
        ...paginatedMovies.flatMap(pageData => pageData.movies)
      ];

      return {
        statusCode: firstPageResponse.status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            // Allow Netlify to cache responses
            'Netlify-CDN-Cache-Control': `public, s-maxage=${60*60*24}, stale-while-revalidate=${60*60*48}, durable`,
            // Optional cache tags for selective purging
            'Netlify-Cache-Tag': 'letterboxd-diary'
        },
        body: JSON.stringify({ movies: allMovies, name, profilePicUrl }),
    };
  } catch (e) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: `Failed to fetch data: ${e}` }),
      };
  }
}
