'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usersApi, gamesApi } from '@/lib/api';
import EditProfileModal from '@/components/EditProfileModal';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const [userGames, setUserGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Use localUser if available (after edit), otherwise use user from auth
  const displayUser = localUser || user;

  useEffect(() => {
    if (displayUser?.userId) {
      loadUserGames();
    }
  }, [displayUser?.userId]);

  // Reload games when user navigates back to this page
  useEffect(() => {
    const handleFocus = () => {
      if (displayUser?.userId) {
        loadUserGames();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Also reload when page becomes visible (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && displayUser?.userId) {
        loadUserGames();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [displayUser?.userId]);

  const loadUserGames = async () => {
    setLoadingGames(true);
    try {
      const games = await usersApi.getUserGames(displayUser.userId);
      setUserGames(games);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSaveProfile = async (bio) => {
    const response = await usersApi.updateProfile(bio);
    setLocalUser(response.user);
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gamesApi.deleteGame(gameId);
      setUserGames(userGames.filter(g => g.game_id !== gameId));
    } catch (err) {
      alert('Failed to delete game: ' + err.message);
    }
  };

  const handleTogglePublish = async (gameId, currentStatus) => {
    try {
      await gamesApi.updateGame(gameId, { isPublished: !currentStatus });
      setUserGames(userGames.map(g => 
        g.game_id === gameId 
          ? { ...g, is_published: !currentStatus }
          : g
      ));
    } catch (err) {
      alert('Failed to update publish status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-foreground/60 max-w-md">
            You need to be logged in to view your profile
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-foreground/10 hover:bg-foreground/20 rounded-md font-medium transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            Edit Profile
          </button>
        </div>
        
        <div className="bg-foreground/5 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-foreground/60">Username:</span>{' '}
                <span className="font-medium">{displayUser.username}</span>
              </div>
              <div>
                <span className="text-foreground/60">Email:</span>{' '}
                <span className="font-medium">{displayUser.email}</span>
              </div>
              <div>
                <span className="text-foreground/60">Bio:</span>{' '}
                <span className="font-medium">
                  {displayUser.profile_bio || 'No bio yet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-foreground/5 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Games</h2>
            <Link
              href="/editor"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors text-sm"
            >
              + New Game
            </Link>
          </div>
          
          {loadingGames ? (
            <p className="text-foreground/60">Loading games...</p>
          ) : userGames.length === 0 ? (
            <p className="text-foreground/60">No games yet. Start creating in the Editor!</p>
          ) : (
            <div className="space-y-3">
              {userGames.map(game => (
                <div
                  key={game.game_id}
                  className="flex justify-between items-center p-4 bg-foreground/5 rounded border border-foreground/10"
                >
                  <div>
                    <h3 className="font-medium">{game.title}</h3>
                    {game.description && (
                      <p className="text-sm text-foreground/60 mt-1">{game.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-foreground/60">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {game.likes_count || 0} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {game.plays_count || 0} plays
                      </span>
                      <span className="flex items-center gap-1">
                        {game.is_published ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Published
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Draft
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/editor?gameId=${game.game_id}`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(game.game_id, game.is_published)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        game.is_published
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {game.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.game_id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        user={displayUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </>
  );
}
