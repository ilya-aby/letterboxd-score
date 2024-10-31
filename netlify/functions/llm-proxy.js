import OpenAI from 'openai';
import dotenv from 'dotenv';
import process from 'process';
import { movieQuipPrompt } from '../../prompts/movieQuipPrompt.js';

export async function handler(event) {
  dotenv.config();
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API Key');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No data provided to LLM proxy" }),
    };
  }

  const { user1Rating, user2Rating, movieTitle } = JSON.parse(event.body);

  console.log('Server received data:', { user1Rating, user2Rating, movieTitle });

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: movieQuipPrompt
        },
        {
          role: "user",
          content: `Movie: "${movieTitle}"\nUser1 rating: ${user1Rating}/5\nUser2 rating: ${user2Rating}/5`
        }
      ],
      response_format: { "type": "json_object" },
      model: "gpt-4o-mini"
    });

    // Parse the response content into an object
    const responseObject = JSON.parse(completion.choices[0].message.content);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Allow Netlify to cache responses
        'Netlify-CDN-Cache-Control': `public, s-maxage=${60*60*24}, stale-while-revalidate=${60*60*48}, durable`,
        // Optional cache tags for selective purging
        'Netlify-Cache-Tag': 'llm-movie-quips'
      },
      body: JSON.stringify({
        user1Response: responseObject.user1Response,
        user2Response: responseObject.user2Response,
        debug: 'API call successful'
      })
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate message',
        details: error.message 
      })
    };
  }
}