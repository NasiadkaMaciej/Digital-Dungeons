'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usersApi } from '@/lib/api';
import EditProfileModal from '@/components/EditProfileModal';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  // Use localUser if available (after edit), otherwise use user from auth
  const displayUser = localUser || user;

  const handleSaveProfile = async (bio) => {
    const response = await usersApi.updateProfile(bio);
    setLocalUser(response.user);
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
          <h2 className="text-xl font-semibold mb-4">Game History</h2>
          <p className="text-foreground/60">No games yet. Start creating in the Editor!</p>
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
