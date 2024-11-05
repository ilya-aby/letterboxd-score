export const movieQuipPrompt = `
You're generating some witty back-and-forth comments for a movie rating comparison app. 
You'll receive an array of movies, each with two user ratings. The ratings are out of 5 stars.
For each movie, create two funny comments as if the users are having a conversation about their rating disagreement.

Return a JSON array where each item has the structure:
{
  "movieTitle": "string",
  "user1Response": "string",
  "user2Response": "string"
}

VERY IMPORTANT ABOUT PERSPECTIVES:
- user1Response must be FROM THE PERSPECTIVE OF THE FIRST USER defending/explaining their own rating
- user2Response must be FROM THE PERSPECTIVE OF THE SECOND USER defending/explaining their own rating
- If user1 gave it a LOW rating, their response should CRITICIZE the movie
- If user1 gave it a HIGH rating, their response should PRAISE the movie
- Same logic applies to user2's response

Example input:
[
  { "movieTitle": "Ant-Man 3", "user1Rating": 0.5, "user2Rating": 4.5 }
]

Example response:
[
  {
    "movieTitle": "Ant-Man 3",
    "user1Response": "This movie shrunk my expectations into the microverse. What a mess.",
    "user2Response": "0.5 stars?! Someone got lost in the Quantum Realm of bad takes."
  }
]

Notice how user1's response matches their low rating (0.5), while user2's response defends their high rating (4.5).

VERY IMPORTANT ABOUT OUTPUT STRUCTURE:
- Your output MUST maintain the exact same order as the input array and include ALL movies.
- If you're unsure about a movie, generate a generic response rather than skipping it.
- Each movieTitle in the response must exactly match the input movieTitle.

Tips for generating good comments:
- Keep the comments concise and witty - they'll appear in text message bubbles, so they need to be short.
- If you know the plot of the movie or any pop culture references & memes around it, feel free to reference those. Otherwise, just make a funny comment.
- You don't have to reference the exact ratings, but you can if you want to.
- DO be funny and clever. Do NOT be corny. It should feel like two witty friends giving each other a hard time.
- Please avoid the phrase "More like" (e.g. "Minari? More like Mehnari!") in comments - it's overused.

Example input:
[
  { "movieTitle": "Super Mario Bros. Movie", "user1Rating": 5, "user2Rating": 2 },
  { "movieTitle": "The Irishman", "user1Rating": 3, "user2Rating": 5 },
  { "movieTitle": "Mulholland Drive", "user1Rating": 2, "user2Rating": 4 }
]

Example response:
[
  {
    "movieTitle": "Super Mario Bros. Movie",
    "user1Response": "Wa-hoo! Super Mario Bros. Movie was a-mazing!",
    "user2Response": "It's-a me, questioning your taste in movies",
  },
  {
    "movieTitle": "The Irishman",
    "user1Response": "Pretty sure I fell asleep during the Irishman 😴 DeNiro CGI was a jump scare.",
    "user2Response": "You're banned from the Scorsese-verse. Go back to Marvel, you're drunk"
  },
  {
    "movieTitle": "Mulholland Drive",
    "user1Response": "Let me guess, David Lynch is a genius and I just didn't understand it?",
    "user2Response": "You just couldn't handle the diner scene 👹"
  }
]
`;
