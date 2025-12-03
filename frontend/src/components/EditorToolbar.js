'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { gamesApi } from '@/lib/api';

export default function EditorToolbar({ onSave, onLoad, onNew }) {
	const { isAuthenticated } = useAuth();
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const handleSave = async () => {
		if (!isAuthenticated) {
			alert('You must be logged in to save games');
			return;
		}
		setShowSaveModal(true);
	};

	const handleSaveConfirm = async (e) => {
		e.preventDefault();
		if (!title.trim()) {
			setError('Title is required');
			return;
		}

		setSaving(true);
		setError('');

		try {
			// Get game data from canvas
			const gameData = window.RPGEditorBridge?.pullStateSnapshot?.();

			if (!gameData || !gameData.rooms || gameData.rooms.length === 0) {
				setError('No rooms created. Add some rooms first!');
				setSaving(false);
				return;
			}

			await onSave({ title, description, gameContent: gameData });

			setShowSaveModal(false);
			setTitle('');
			setDescription('');
			alert('Game saved successfully!');
		} catch (err) {
			setError(err.message || 'Failed to save game');
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<div className="fixed top-20 left-4 z-40 flex flex-col gap-2">
				<button
					onClick={onNew}
					className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-md font-medium transition-colors"
					title="New Game"
				>
					New
				</button>
				<button
					onClick={handleSave}
					disabled={!isAuthenticated}
					className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
					title="Save Game"
				>
					Save
				</button>
				<button
					onClick={onLoad}
					disabled={!isAuthenticated}
					className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
					title="Load Game"
				>
					Load
				</button>
			</div>

			{showSaveModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
					<div className="bg-background border border-foreground/10 rounded-lg p-6 w-full max-w-md">
						<h2 className="text-2xl font-bold mb-4">Save Game</h2>

						{error && (
							<div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
								{error}
							</div>
						)}

						<form onSubmit={handleSaveConfirm} className="space-y-4">
							<div>
								<label htmlFor="title" className="block text-sm font-medium mb-2">
									Title *
								</label>
								<input
									type="text"
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									maxLength={100}
									required
									className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-blue-500 text-foreground"
								/>
							</div>

							<div>
								<label htmlFor="description" className="block text-sm font-medium mb-2">
									Description
								</label>
								<textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
									className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-blue-500 text-foreground resize-none"
								/>
							</div>

							<div className="flex gap-3 justify-end">
								<button
									type="button"
									onClick={() => {
										setShowSaveModal(false);
										setError('');
										setTitle('');
										setDescription('');
									}}
									disabled={saving}
									className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 rounded font-medium transition-colors disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={saving}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors disabled:opacity-50"
								>
									{saving ? 'Saving...' : 'Save'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
