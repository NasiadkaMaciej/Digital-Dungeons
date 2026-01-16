'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { gamesApi, usersApi } from '@/lib/api';
import EditProfileModal from '@/components/EditProfileModal';
import { redirect } from "next/navigation";

export default function ProfilePage() {
	const { user, loading, isAuthenticated, logout } = useAuth();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [localUser, setLocalUser] = useState(null);
	const [userGames, setUserGames] = useState([]);
	const [loadingGames, setLoadingGames] = useState(false);
	const [searchGames, setSearchGames] = useState('');

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
				<p className="text-foreground/60 font-mono">Loading...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		redirect("/login");
	}

	// Filter games based on search
	const filteredGames = userGames.filter(game =>
		game.title.toLowerCase().includes(searchGames.toLowerCase()) ||
		(game.description && game.description.toLowerCase().includes(searchGames.toLowerCase()))
	);

	return (
		<>
			<div className="space-y-12">
				<div className="flex justify-between items-center">
					<h1 className="text-5xl font-black">Profile</h1>
					<div>
						<button
							onClick={() => setIsEditModalOpen(true)}
							className="px-5 py-3 bg-background border-1 border-foreground/20 text-sm hover:border-red-500 text-foreground rounded-md cursor-pointer font-medium"
						>
							Edit
						</button>
						<button
							type="button"
							onClick={() => {
								logout();
								window.location.href = "/";
							}}
							className="px-5 py-3 ml-3 bg-red-500 text-sm hover:bg-red-700 text-background rounded-md cursor-pointer font-medium"
						>
							Logout
						</button>
					</div>
				</div>

				<div className="bg-background border-1 border-red-500 rounded-lg px-12 py-10 space-y-10">
					<div>
						<h2 className="text-3xl font-black mb-4 text-foreground">Account Information</h2>
						<div className="space-y-2 font-mono text-sm">
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

				<div className="px-12 py-10 bg-background rounded-lg border-1 border-red-500">
					<div className="flex justify-between items-center mb-10">
						<h2 className="text-3xl font-black">My Games</h2>
						<Link
							href="/editor"
							className="flex items-center justify-center bg-red-500 hover:bg-red-700 text-background rounded-md font-medium text-xl w-14 aspect-square"
						>
							+
						</Link>
					</div>

				{userGames.length > 0 && (
					<div className="mb-6">
						<input
							type="text"
							value={searchGames}
							onChange={e => setSearchGames(e.target.value)}
							placeholder="Search your games..."
							className="w-full px-4 py-2 border border-foreground/20 rounded-md font-mono text-base bg-background focus:outline-none focus:border-red-500"
						/>
					</div>
				)}

				{loadingGames ? (
					<p className="text-foreground/60">Loading games...</p>
				) : userGames.length === 0 ? (
					<p className="text-foreground/60 font-mono text-sm text-center pt-5 pb-10"><Link href={"/editor"} className={"text-red-500" +
						" hover:underline hover:text-red-700"}>Create</Link> your first game.</p>
				) : filteredGames.length === 0 ? (
					<p className="text-foreground/60 font-mono text-sm text-center pt-5 pb-10">No games found matching your search.</p>
				) : (
					<div className="space-y-3">
						{filteredGames.map(game => (
								<div
									key={game.game_id}
									className="flex justify-between items-center p-4 bg-foreground/5 rounded border border-foreground/10"
								>
									<div>
										<h3 className="font-medium">{game.title}</h3>
										{game.description && (
											<p className="text-sm text-foreground/60 mt-1">{game.description}</p>
										)}									{game.tags && game.tags.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2 mb-2">
											{game.tags.map((tag) => (
												<span
													key={tag}
													className="inline-block px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-mono border border-red-500/30"
												>
													{tag}
												</span>
											))}
										</div>
									)}										<div className="flex gap-4 mt-2 text-xs text-foreground/60">
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
											className={`px-3 py-1 rounded text-sm transition-colors ${game.is_published
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