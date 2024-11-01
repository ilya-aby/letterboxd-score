// Compute aggregates for a user from their movie data
export function getUserStats(userData) {
  if (!userData) return {};

  const moviesWithRatings = userData.movies.filter((movie) => movie.rating);
  const totalFilms = userData.movies.length;
  const averageRating =
    moviesWithRatings.length > 0
      ? moviesWithRatings.reduce((sum, movie) => sum + movie.rating, 0) / moviesWithRatings.length
      : 0;

  return { totalFilms, averageRating };
}
``;

// Compute the biggest rating disagreements between two users & fetch LLM-generated diss messages
// Note that Letterboxd stores ratings on a scale of 1-10 but displays them as 0-5 stars
// It's not possible to rate a movie 0 stars on Letterboxd - so 0.5 stars (rating=1) is the lowest possible rating
// Some users don't rate movies but use isLiked, so we treat isLiked=true as a 5-star rating in that case
export async function getRatingDisagreements(user1, user2) {
  if (!user1 || !user2) return [];

  // Filter movies to only those with ratings/isLiked
  const getValidMovies = (movies) => movies.filter((movie) => movie.rating || movie.isLiked);

  const user1Movies = getValidMovies(user1.movies);
  const user2Movies = getValidMovies(user2.movies);

  // Find movies with disagreements
  const disagreements = [];
  user1Movies.forEach((movie1) => {
    const movie2 = user2Movies.find((m) => m.filmId === movie1.filmId);
    if (!movie2) return;

    let difference = null;

    // Handle regular ratings comparison
    if (movie1.rating && movie2.rating) {
      difference = movie1.rating - movie2.rating;
    }
    // Handle isLiked=true vs low rating special case
    else if (movie1.isLiked && movie2.rating && movie2.rating <= 5) {
      difference = 10 - movie2.rating; // Treat isLiked=true as a 5-star rating
    } else if (movie2.isLiked && movie1.rating && movie1.rating <= 5) {
      difference = movie1.rating - 10; // Treat isLiked=true as a 5-star rating
    }

    // Only include meaningful rating differences of 1.5 stars or more (3 rating points)
    if (difference !== null && Math.abs(difference) >= 3) {
      disagreements.push({
        filmId: movie1.filmId,
        title: movie1.title,
        posterUrl: movie1.posterUrl,
        letterboxdUrl: movie1.letterboxdUrl,
        user1Rating: movie1.rating || (movie1.isLiked ? '❤️' : null),
        user2Rating: movie2.rating || (movie2.isLiked ? '❤️' : null),
        ratingDifference: Math.abs(difference),
      });
    }
  });

  // Sort by absolute difference and limit to 10 items BEFORE fetching diss messages
  const topDisagreements = disagreements
    .sort((a, b) => b.ratingDifference - a.ratingDifference)
    .slice(0, 10);

  console.log('topDisagreements', topDisagreements);

  // Fetch diss messages for each disagreement
  for (const disagreement of topDisagreements) {
    const response = await fetch('/.netlify/functions/llm-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1Rating:
          typeof disagreement.user1Rating === 'number'
            ? (disagreement.user1Rating / 2).toFixed(1)
            : '5.0',
        user2Rating:
          typeof disagreement.user2Rating === 'number'
            ? (disagreement.user2Rating / 2).toFixed(1)
            : '5.0',
        movieTitle: disagreement.title,
      }),
    });

    const data = await response.json();
    console.log(data);

    disagreement.user1DissMessage = data.user1Response;
    disagreement.user2DissMessage = data.user2Response;
  }

  // Sort by absolute difference and limit to 10 items
  return topDisagreements;
}