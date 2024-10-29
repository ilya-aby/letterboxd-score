import { useState, useMemo } from "react";
import { Loader2 } from 'lucide-react';
// import posterPlaceholder from './assets/poster-placeholder.png';
import avatarPlaceholder from './assets/avatar-placeholder.webp';
import vsImage from './assets/vs-image.png';

const AppStates = {
  SELECT_USERS: 'select-users',
  LOADING: 'loading',
  ERROR: 'error',
  COMPARE: 'compare'
}

const getUserStats = (userData) => {
  if (!userData) return {};

  const totalFilms = userData.movies.length;
  const averageRating = userData.movies.reduce((sum, movie) => sum + movie.rating, 0) / totalFilms;
  const filmsThisYear = userData.movies.filter(movie => new Date(movie.watchDate).getFullYear() === new Date().getFullYear()).length;

  return { totalFilms, averageRating, filmsThisYear };
}

export default function App() {

  const [appState, setAppState] = useState(AppStates.SELECT_USERS);
  const [user1Username, setUser1Username] = useState("");
  const [user2Username, setUser2Username] = useState("");
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ user1: null, user2: null });

  const user1Stats = useMemo(() => getUserStats(userData.user1), [userData.user1]);
  const user2Stats = useMemo(() => getUserStats(userData.user2), [userData.user2]);

  const thisYear = new Date().getFullYear();

  const fetchData = async () => {
    setError(null);
    setAppState(AppStates.LOADING);
    
    try {
      // Fetch both users simultaneously
      const [user1Response, user2Response] = await Promise.all([
        fetch(`/.netlify/functions/netlify-proxy?url=https://letterboxd.com/${user1Username}/films/diary/`),
        fetch(`/.netlify/functions/netlify-proxy?url=https://letterboxd.com/${user2Username}/films/diary/`)
      ]);

      // Check if both responses are ok
      if (!user1Response.ok || !user2Response.ok) {
        throw new Error(
          !user1Response.ok 
            ? `Error fetching ${user1Username}: ${user1Response.statusText}`
            : `Error fetching ${user2Username}: ${user2Response.statusText}`
        );
      }

      const [user1Data, user2Data] = await Promise.all([
        user1Response.json(),
        user2Response.json()
      ]);

      // Set default profile pictures if needed
      if (!user1Data.profilePicUrl) user1Data.profilePicUrl = avatarPlaceholder;
      if (!user2Data.profilePicUrl) user2Data.profilePicUrl = avatarPlaceholder;

      setUserData({ user1: user1Data, user2: user2Data });
      setAppState(AppStates.COMPARE);
    } catch (error) {
      setError(error.message);
      setAppState(AppStates.ERROR);
    }
  }

  // const getMovieCards = () => {
  //   return userData.movies.map((movie) => (
  //     <div key={movie.filmId}>
  //       <img src={movie.posterUrl || posterPlaceholder} 
  //         alt={movie.title} 
  //         className="w-32 h-auto" 
  //         onError={(e) => e.target.src = posterPlaceholder} 
  //       />
  //     </div>
  //   ));
  // }

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full mx-auto px-4 py-10 shadow-lg bg-gray-100 rounded-lg max-w-4xl min-h-full sm:min-h-[80vh] sm:w-10/12 sm:my-10">
        {appState !== AppStates.COMPARE && 
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <div className="flex flex-col items-center justify-center gap-2 w-2/3 sm:w-full sm:flex-row">
              <input 
                className="text-gray-700 w-full p-2 rounded-md border-2 border-purple-300 shadow-md sm:w-1/3" 
              type="text" autoComplete="off" placeholder="Letterboxd username" 
                value={user1Username} 
                onChange={(e) => setUser1Username(e.target.value)} 
              />
              <input 
                className="text-gray-700 w-full p-2 rounded-md border-2 border-purple-300 shadow-md sm:w-1/3" 
                type="text" autoComplete="off" placeholder="Letterboxd username" 
                value={user2Username} 
                onChange={(e) => setUser2Username(e.target.value)} 
              />
            </div>
            <button 
              className={`bg-purple-700 text-white px-6 py-2 rounded-md pt ${
                appState === AppStates.LOADING 
                ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-purple-800'
            }`}
              onClick={fetchData}
            >
              Fetch
            </button>
        </div>
        }

        {appState === AppStates.ERROR && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
        {appState === AppStates.LOADING && <Loader2 className="mt-4w-12 h-12 animate-spin text-purple-700" />}
        {appState === AppStates.COMPARE && 
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4 max-w-lg">
              <div className="flex flex-col items-center justify-center gap-2">
                <img src={userData.user1.profilePicUrl} alt={userData.user1.name} className="w-20 h-auto rounded-full border-2 border-purple-700" />
                <h1 className="text-xl font-bold">{userData.user1.name}</h1>
              </div>
              <img src={vsImage} alt="vs" className="w-16 h-auto" />
              <div className="flex flex-col items-center justify-center gap-2">
                <img src={userData.user2.profilePicUrl} alt={userData.user2.name} className="w-20 h-auto rounded-full border-2 border-purple-700" />
                <h1 className="text-xl font-bold">{userData.user2.name}</h1>
              </div>
            </div>
            {/* <div className="flex justify-center w-full gap-2 flex-wrap mt-6">
              {getMovieCards()}
            </div> */}
            <table className="mt-8 max-w-lg border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-center">{user1Stats.totalFilms || 0}</td>
                  <th className="w-40 py-2 text-center font-medium text-gray-600">Total Films</th>
                  <td className="py-2 text-center">{user2Stats.totalFilms || 0}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-center">{user1Stats.filmsThisYear || '-'}</td>
                  <th className="w-1/5 py-2 text-center font-medium text-gray-600">{thisYear} Films</th>
                  <td className="py-2 text-center">{user2Stats.filmsThisYear || '-'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-center">{user1Stats.averageRating ? (user1Stats.averageRating / 2).toFixed(1) : '-'}</td>
                  <th className="w-1/5 py-2 text-center font-medium text-gray-600">Avg. Rating</th>
                  <td className="py-2 text-center">{user2Stats.averageRating ? (user2Stats.averageRating / 2).toFixed(1) : '-'}</td>
                </tr>
              </tbody>
            </table>
          </>
        }
      </div>
    </>
  )
}
