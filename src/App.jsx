import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { getUserStats, getRatingDisagreements } from './utils/movieAnalytics';
import MessageBubble from './components/MessageBubble';
import posterPlaceholder from './assets/poster-placeholder.png';
import avatarPlaceholder from './assets/avatar-placeholder.webp';
import vsImage from './assets/vs-image.png';
import bannerImage from './assets/showdown-banner.png';
import bannerImageMobile from './assets/showdown-banner-vertical.png';

const AppStates = {
  SELECT_USERS: 'select-users',
  LOADING: 'loading',
  ERROR: 'error',
  COMPARE: 'compare',
};

export default function App() {
  const [appState, setAppState] = useState(AppStates.SELECT_USERS);
  const [user1Username, setUser1Username] = useState('');
  const [user2Username, setUser2Username] = useState('');
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ user1: null, user2: null });
  const [ratingDisagreements, setRatingDisagreements] = useState([]);

  const user1Stats = useMemo(() => getUserStats(userData.user1), [userData.user1]);
  const user2Stats = useMemo(() => getUserStats(userData.user2), [userData.user2]);

  const fetchData = async () => {
    if (!user1Username || !user2Username) {
      setError('Please enter both usernames');
      setAppState(AppStates.ERROR);
      return;
    }

    setError(null);
    setAppState(AppStates.LOADING);

    try {
      // Note that we use the netlify function to avoid CORS issues
      // The proxy will handle pagination and return all movies for each user
      const [user1Response, user2Response] = await Promise.all([
        fetch(
          `/.netlify/functions/letterboxd-proxy?url=https://letterboxd.com/${user1Username}/films/`
        ),
        fetch(
          `/.netlify/functions/letterboxd-proxy?url=https://letterboxd.com/${user2Username}/films/`
        ),
      ]);

      if (!user1Response.ok || !user2Response.ok) {
        throw new Error(
          !user1Response.ok
            ? `Error fetching ${user1Username}: ${user1Response.statusText}`
            : `Error fetching ${user2Username}: ${user2Response.statusText}`
        );
      }

      const [user1Data, user2Data] = await Promise.all([
        user1Response.json(),
        user2Response.json(),
      ]);

      // Set default profile pictures if needed
      if (!user1Data.profilePicUrl) user1Data.profilePicUrl = avatarPlaceholder;
      if (!user2Data.profilePicUrl) user2Data.profilePicUrl = avatarPlaceholder;

      setUserData({ user1: user1Data, user2: user2Data });
      const disagreements = await getRatingDisagreements(user1Data, user2Data);
      setRatingDisagreements(disagreements);
      setAppState(AppStates.COMPARE);
    } catch (error) {
      setError(error.message);
      setAppState(AppStates.ERROR);
    }
  };

  const getRatingSymbol = (rating) => {
    if (rating === '❤️') return '❤️';
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 ? '½' : '';
    return '⭐️'.repeat(fullStars) + halfStar;
  };

  // Responsive placement - on mobile, makes it look like an iMessage conversation
  const renderDisagreements = () => {
    return ratingDisagreements.map((disagreement, index) => (
      <div
        key={disagreement.filmId}
        className='flex w-full flex-col items-start justify-center mt-10 gap-2 sm:gap-4 sm:flex-row'
      >
        <div className='flex flex-col items-end self-start sm:self-auto'>
          <div className='text-sm sm:text-base'>{getRatingSymbol(disagreement.user1Rating)}</div>
          <MessageBubble
            message={disagreement.user1DissMessage}
            isYours={false}
            bgColor='bg-gray-900'
          />
        </div>
        <a
          href={disagreement.letterboxdUrl}
          target='_blank'
          rel='noopener noreferrer'
          className={`${index % 2 === 0 ? 'self-start' : 'self-end'} 
            order-first sm:self-center sm:order-none`}
        >
          <img
            src={disagreement.posterUrl || posterPlaceholder}
            alt={disagreement.title}
            className={`w-32 h-auto rounded-md border border-gray-700 sm:w-40
              transition-all duration-300 ease-in-out
              hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20`}
            onError={(e) => (e.target.src = posterPlaceholder)}
          />
        </a>
        <div className='flex flex-col items-start self-end sm:self-auto'>
          <div className='text-sm sm:text-base'>{getRatingSymbol(disagreement.user2Rating)}</div>
          <MessageBubble
            message={disagreement.user2DissMessage}
            isYours={true}
            bgColor='bg-gray-900'
          />
        </div>
      </div>
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 via-purple-400 to-pink-300 sm:py-10'>
      <div className='relative flex flex-col items-center justify-center w-full mx-auto px-4 py-10 shadow-xl bg-gray-900 text-gray-100 max-w-4xl min-h-screen sm:mx-4 sm:rounded-xl sm:min-h-[80vh] sm:overflow-hidden'>
        {appState !== AppStates.COMPARE && (
          <>
            <p className='text-gray-100 font-bold text-2xl mb-4 absolute top-8 left-8 z-10'>Letterboxd VS.</p>
            <img
              src={bannerImage}
              alt='Letterboxd VS.'
              className='w-full h-auto hidden sm:block sm:shadow-xl sm:rounded-xl sm:absolute sm:inset-0 sm:w-full sm:h-full sm:object-cover sm:opacity-60'
            />
            <img
              src={bannerImageMobile}
              alt='Letterboxd VS.'
              className='w-full h-screen inset-0 absolute object-cover opacity-70 block sm:hidden'
            />
            <div className='flex flex-col items-center justify-center w-full gap-4 z-10'>
              <form
                onSubmit={handleSubmit}
                className='flex flex-col items-center justify-center gap-4 w-full'
              >
                <div className='flex flex-col items-center justify-center gap-2 w-2/3 sm:w-full sm:flex-row'>
                  <input
                    className='bg-gray-800 text-gray-200 w-full p-2 rounded-md border-2 border-purple-300 shadow-md sm:w-1/3'
                    type='text'
                    autoComplete='off'
                    data-lpignore='true'
                    data-1p-ignore='true'
                    placeholder='Letterboxd username'
                    value={user1Username}
                    onChange={(e) => setUser1Username(e.target.value)}
                    required
                    aria-label="First user's Letterboxd username"
                  />
                  <input
                    className='bg-gray-800 text-gray-200 w-full p-2 rounded-md border-2 border-purple-300 shadow-md sm:w-1/3'
                    type='text'
                    autoComplete='off'
                    data-lpignore='true'
                    data-1p-ignore='true'
                    placeholder='Letterboxd username'
                    value={user2Username}
                    onChange={(e) => setUser2Username(e.target.value)}
                    required
                    aria-label="Second user's Letterboxd username"
                  />
                </div>
                <button
                  type='submit'
                  className={`bg-purple-700 text-white px-6 py-2 rounded-md min-w-28 shadow-md ${
                    appState === AppStates.LOADING
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-purple-800'
                  }`}
                  disabled={appState === AppStates.LOADING}
                >
                  {appState === AppStates.LOADING ? (
                    <Loader2 className='size-5 animate-spin mx-auto' />
                  ) : (
                    'Face Off'
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {appState === AppStates.ERROR && (
          <p className='text-red-500 text-sm mt-2 font-bold'>{error}</p>
        )}
        {appState === AppStates.COMPARE && (
          <>
            <button
              className='absolute top-0 left-0 p-2 text-purple-700 hover:text-purple-500 rounded-full sm:top-4 sm:left-4'
              onClick={() => setAppState(AppStates.SELECT_USERS)}
              aria-label='Go back to user selection'
            >
              <ChevronLeft className='size-8' />
            </button>
            <div className='grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4 max-w-lg'>
              <div className='flex flex-col items-center justify-center gap-2'>
                <img
                  src={userData.user1.profilePicUrl}
                  alt={userData.user1.name}
                  className='w-20 h-auto rounded-full border-2 border-purple-700'
                />
                <h1 className='text-xl font-bold'>{userData.user1.name}</h1>
              </div>
              <img src={vsImage} alt='vs' className='w-16 h-auto' />
              <div className='flex flex-col items-center justify-center gap-2'>
                <img
                  src={userData.user2.profilePicUrl}
                  alt={userData.user2.name}
                  className='w-20 h-auto rounded-full border-2 border-purple-700'
                />
                <h1 className='text-xl font-bold'>{userData.user2.name}</h1>
              </div>
            </div>
            {renderDisagreements()}
            <table className='mt-8 max-w-lg border-collapse'>
              <tbody>
                <tr className='border-b border-gray-200'>
                  <td className='w-32 py-2 text-center'>{user1Stats.totalFilms || 0}</td>
                  <th className='w-40 py-2 text-center font-medium text-gray-400'>Total Films</th>
                  <td className='w-32 py-2 text-center'>{user2Stats.totalFilms || 0}</td>
                </tr>
                <tr className='border-b border-gray-200'>
                  <td className='py-2 text-center'>
                    {user1Stats.averageRating ? (user1Stats.averageRating / 2).toFixed(1) : '-'} ⭐️
                  </td>
                  <th className='w-1/5 py-2 text-center font-medium text-gray-400'>Avg. Rating</th>
                  <td className='py-2 text-center'>
                    {user2Stats.averageRating ? (user2Stats.averageRating / 2).toFixed(1) : '-'} ⭐️
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
