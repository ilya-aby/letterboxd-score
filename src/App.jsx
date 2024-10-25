import { useState } from "react";

const AppStates = {
  DEFAULT: 'default',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
}

export default function App() {

  const [appState, setAppState] = useState(AppStates.DEFAULT);
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [movieData, setMovieData] = useState([]);

  const fetchData = async () => {
    setError(null);
    setAppState(AppStates.LOADING);
    
    if (!username) {
      setError("Username is required");
      setAppState(AppStates.ERROR);
      return;
    }

    try {
      const response = await fetch(`/.netlify/functions/netlify-proxy?url=https://letterboxd.com/${username}/films/diary/`);
      if (!response.ok) {
        throw new Error(`${response.statusText}`);
      }
      const data = await response.json();
      setMovieData(data.movies);
      setAppState(AppStates.SUCCESS);
    } catch (error) {
      setError(error.message);
      setAppState(AppStates.ERROR);
    }
  }

  const getMovieCards = () => {
    return movieData.map((movie) => (
      <div key={movie.filmId}>
        <img src={movie.posterUrl || './src/assets/poster-placeholder.png'} 
          alt={movie.title} 
          className="w-32 h-auto" 
          onError={(e) => e.target.src = './src/assets/poster-placeholder.png'} 
        />
      </div>
    ));
  }

  return (
    <>
      <div className="flex flex-col items-center justify-start w-10/12 mx-auto my-10 px-4 py-10 shadow-lg bg-gray-100 rounded-lg max-w-4xl min-h-[80vh]">
        <div className="flex items-center justify-center w-full gap-2">
          <input 
            className="text-gray-700 w-1/3 p-2 rounded-md border-2 border-purple-300 shadow-md" 
            type="text" autoComplete="off" placeholder="Letterboxd username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <button 
            className={`bg-purple-700 text-white px-6 py-2 rounded-md ${
              appState === AppStates.LOADING 
                ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-purple-800'
            }`}
            onClick={fetchData}
          >
            Fetch
          </button>
        </div>
        {appState === AppStates.ERROR && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
        {appState === AppStates.SUCCESS && 
          <div className="flex justify-center w-full gap-2 flex-wrap mt-6">
            {getMovieCards()}
          </div>
        }
      </div>
    </>
  )
}