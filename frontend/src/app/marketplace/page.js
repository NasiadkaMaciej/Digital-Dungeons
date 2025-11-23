'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useAuth} from '@/lib/AuthContext';
import {gamesApi, likesApi} from '@/lib/api';

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedGames, setLikedGames] = useState(new Set());

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const publishedGames = await gamesApi.getAllGames();
      setGames(publishedGames);

      // Load liked status for authenticated users
      if (isAuthenticated) {
        const likeChecks = await Promise.allSettled(
          publishedGames.map(game => likesApi.checkLike(game.game_id))
        );
        const liked = new Set();
        likeChecks.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.liked) {
            liked.add(publishedGames[index].game_id);
          }
        });
        setLikedGames(liked);
      }
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (gameId) => {
    if (!isAuthenticated) {
      alert('Please log in to like games');
      return;
    }

    try {
      const isLiked = likedGames.has(gameId);

      if (isLiked) {
        await likesApi.unlikeGame(gameId);
        setLikedGames(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameId);
          return newSet;
        });
        setGames(games.map(g =>
          g.game_id === gameId
            ? { ...g, likes_count: Math.max(0, g.likes_count - 1) }
            : g
        ));
      } else {
        await likesApi.likeGame(gameId);
        setLikedGames(prev => new Set(prev).add(gameId));
        setGames(games.map(g =>
          g.game_id === gameId
            ? { ...g, likes_count: g.likes_count + 1 }
            : g
        ));
      }
    } catch (err) {
      alert('Failed to update like: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-foreground/60 font-mono">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black">Marketplace</h1>
          <p className="text-foreground/60 mt-3 mb-5 font-mono">
              of all the worlds created by our growing community of nerds <span style={{whiteSpace: "nowrap"}}>(⌐⊙_⊙)</span>.
          </p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 bg-background border-1 border-foreground/5 rounded-lg font-mono">
            <p className="text-foreground/60">No published games yet <span style={{whiteSpace: "nowrap"}}>( ✜︵✜ )</span>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div
              key={game.game_id}
              className="bg-foreground/5 rounded-lg p-5 border border-foreground/10 hover:border-foreground/20 transition-all flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{game.title}</h3>
                <p className="text-sm text-foreground/60 mb-1">
                  by {game.author_name}
                </p>
                {game.description && (
                  <p className="text-foreground/80 text-sm mt-3 mb-4 line-clamp-3">
                    {game.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-foreground/60 mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleLike(game.game_id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedGames.has(game.game_id)
                        ? 'text-red-500'
                        : 'hover:text-foreground'
                    }`}
                    disabled={!isAuthenticated}
                  >
                    <svg className="w-4 h-4" fill={likedGames.has(game.game_id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{game.likes_count || 0}</span>
                  </button>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {game.plays_count || 0}
                  </span>
                </div>
                <span className="text-xs">
                  {new Date(game.create_date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/game/${game.game_id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors text-center text-sm"
                >
                  View Details
                </Link>
                <Link
                  href={`/play/${game.game_id}`}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors text-center text-sm flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}