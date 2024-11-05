import OpenAI from 'openai';
import dotenv from 'dotenv';
import process from 'process';
import { movieQuipPrompt } from '../../prompts/movieQuipPrompt.js';

const LLM_MODEL = 'anthropic/claude-3-5-haiku';
const SITE_URL = 'https://letterboxdvs.com';
const SITE_NAME = 'Letterboxd VS.';

export async function handler(event) {
  dotenv.config();
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    console.error('Missing OpenRouter API Key');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No data provided to LLM proxy' }),
    };
  }

  const { user1Rating, user2Rating, movieTitle } = JSON.parse(event.body);

  console.log('Server received data:', { user1Rating, user2Rating, movieTitle });

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: movieQuipPrompt,
        },
        {
          role: 'user',
          content: `Movie: "${movieTitle}"\nUser1 rating: ${user1Rating}/5\nUser2 rating: ${user2Rating}/5`,
        },
      ],
      response_format: { type: 'json_object' },
      model: LLM_MODEL,
    });

    // Parse the response content into an object
    const responseObject = JSON.parse(completion.choices[0].message.content);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Allow Netlify to cache responses
        'Netlify-CDN-Cache-Control': `public, s-maxage=${60 * 60 * 24}, stale-while-revalidate=${
          60 * 60 * 48
        }, durable`,
        // Optional cache tags for selective purging
        'Netlify-Cache-Tag': 'llm-movie-quips',
      },
      body: JSON.stringify({
        user1Response: responseObject.user1Response,
        user2Response: responseObject.user2Response,
        debug: 'API call successful',
      }),
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate message',
        details: error.message,
      }),
    };
  }
}
