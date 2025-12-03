'use client';

import { useState } from 'react';

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
	const [bio, setBio] = useState(user?.profile_bio || '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			await onSave(bio);
			onClose();
		} catch (err) {
			setError(err.message || 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-12 py-10 bg-background/80 backdrop-blur-xs">
			<div className="bg-background border border-red-500 rounded-lg px-12 py-10 w-full max-w-md">
				<h2 className="text-2xl font-black mb-4">Edit Profile</h2>

				{error && (
					<div className="bg-red-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-8">
					<div>
						<label htmlFor="bio" className="block text-sm font-medium mb-1">
							Bio
						</label>
						<textarea
							id="bio"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							maxLength={500}
							rows={5}
							placeholder="Tell us about yourself..."
							className="w-full px-4 py-2 text-sm bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-red-500 text-foreground font-mono resize-none"
						/>
						<p className="text-sm text-foreground/60 font-mono">
							{bio.length}/500 characters
						</p>
					</div>

					<div className="flex gap-3 justify-end">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="px-4 py-2 bg-background border-1 border-foreground/20 hover:border-red-500 rounded font-medium disabled:opacity-50 cursor-pointer text-sm text-foreground"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded font-medium disabled:opacity-50 cursor-pointer text-sm text-background"
						>
							{loading ? 'Saving...' : 'Save'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}