# Letterboxd VS.

A head-to-head movie comparison page to compare the tastes of Letterboxd users

## Features

- Uses Netlify Functions as a proxy to scrape Letterboxd movie rating data for the given users, which is publicly available
- Processes movie ratings data to find movies the users most disagree on
- Uses Netlify Functions as a proxy to make LLM calls to generate some mild trash talk between the users about their most-disagreed-upon films
- Renders an iMessage-like layout for the generated text
- Responsive design

## Technologies Used

- HTML
- CSS
- JavaScript
- React
- Vite
- Netlify Functions
- OpenAI LLM APIs
- Tailwind

## Installation

- `npm install`
- `npm run dev` for local server or `npm run build`
- for dev, add `OPENAI_API_KEY=` to `.env`
- for prod, provide the OpenAI API Key as a build variable
