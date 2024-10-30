import OpenAI from 'openai';
import dotenv from 'dotenv';
import process from 'process';

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

  if (!event.queryStringParameters || !event.queryStringParameters.data) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No data provided to LLM proxy" }),
    };
  }

  const { data } = event.queryStringParameters;

  console.log('Server received data:', data);

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: "Generate a short, funny movie-related insult about someone who rated Barbie 1/5 stars. Keep it under 50 characters." 
      }],
      model: "gpt-4o-mini"
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: completion.choices[0].message.content,
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