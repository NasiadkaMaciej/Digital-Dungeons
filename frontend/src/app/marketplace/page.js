'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { gamesApi, likesApi } from '@/lib/api';
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();

	const [games, setGames] = useState([]);
	const [loading, setLoading] = useState(true);
	const [likedGames, setLikedGames] = useState(new Set());
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState(new Set());
	const [availableTags, setAvailableTags] = useState([]);

	useEffect(() => {
		loadGames();
	}, [selectedTags]);

	const loadGames = async () => {
		setLoading(true);
		try {
			const tagsParam = selectedTags.size > 0 ? Array.from(selectedTags).join(',') : '';
			const publishedGames = await gamesApi.getAllGames(tagsParam ? `?tags=${tagsParam}` : '');
			setGames(publishedGames);

			// Extract all unique tags from games
			const tags = new Set();
			publishedGames.forEach((game) => {
				if (game.tags && Array.isArray(game.tags)) {
					game.tags.forEach(tag => tags.add(tag));
				}
			});
			setAvailableTags(Array.from(tags).sort());

			// Load liked status for authenticated users
			if (isAuthenticated) {
				const likeChecks = await Promise.allSettled(
					publishedGames.map((game) => likesApi.checkLike(game.game_id)),
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
				setLikedGames((prev) => {
					const newSet = new Set(prev);
					newSet.delete(gameId);
					return newSet;
				});
				setGames(
					games.map((g) =>
						g.game_id === gameId
							? { ...g, likes_count: Math.max(0, g.likes_count - 1) }
							: g,
					),
				);
			} else {
				await likesApi.likeGame(gameId);
				setLikedGames((prev) => new Set(prev).add(gameId));
				setGames(
					games.map((g) =>
						g.game_id === gameId
							? { ...g, likes_count: g.likes_count + 1 }
							: g,
					),
				);
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

	// Filtrowanie gier po tytule i autorze
	const filteredGames = games.filter(
		(game) =>
			game.title.toLowerCase().includes(search.toLowerCase()) ||
			(game.author_name && game.author_name.toLowerCase().includes(search.toLowerCase()))
	);

	const toggleTag = (tag) => {
		setSelectedTags((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tag)) {
				newSet.delete(tag);
			} else {
				newSet.add(tag);
			}
			return newSet;
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-5xl font-black">Marketplace</h1>
					<p className="text-foreground/60 mb-8 font-mono">
						of all the worlds created by our growing community of nerds{' '}
						<span style={{ whiteSpace: 'nowrap' }}>(⌐⊙_⊙)</span>.
					</p>
				</div>
			</div>

			{/* Wyszukiwarka gier */}
			<div className="mb-6">
				<input
					type="text"
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search games by title or author..."
					className="w-full px-4 py-2 border border-foreground/20 rounded-md font-mono text-base bg-background focus:outline-none focus:border-red-500"
				/>
			</div>

			{/* Tag filter */}
			{availableTags.length > 0 && (
				<div className="mb-6">
					<p className="text-sm text-foreground/60 font-mono mb-3">Filter by tags:</p>
					<div className="flex flex-wrap gap-2">
						{availableTags.map((tag) => (
							<button
								key={tag}
								onClick={() => toggleTag(tag)}
								className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
									selectedTags.has(tag)
										? 'bg-red-500 text-background'
										: 'bg-background border border-foreground/20 text-foreground/60 hover:border-red-500'
								}`}
							>
								{tag}
							</button>
						))}
						{selectedTags.size > 0 && (
							<button
								onClick={() => setSelectedTags(new Set())}
								className="px-3 py-1 rounded-md text-xs font-mono bg-background border border-foreground/20 text-foreground/60 hover:border-red-500"
							>
								Clear filters
							</button>
						)}
					</div>
				</div>
			)}

			{filteredGames.length === 0 ? (
				<div className="text-center py-12 bg-background border-1 border-foreground/5 rounded-lg font-mono">
					<p className="text-foreground/60">
						No games found{' '}
						<span style={{ whiteSpace: 'nowrap' }}>( ✜︵✜ )</span>.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredGames.map((game) => (
						<Link
							href={`/game/${game.game_id}`}
							key={game.game_id}
							className="cursor-pointer bg-background rounded-lg p-10 border border-foreground/10 hover:border-red-500 transition-all flex flex-col"
						>
							<div className="flex-1">
								<h3 className="text-2xl font-black text-red-500">{game.title}</h3>
								<p className="text-xs text-foreground/60 font-mono mt-[-.6rem] mb-7">
									by {game.author_name}
								</p>
								{game.description && (
									<p className="text-foreground/80 text-sm mt-3 mb-4 line-clamp-3 font-mono">
										{game.description}
									</p>
								)}
								{game.tags && game.tags.length > 0 && (
									<div className="mb-4 flex flex-wrap gap-2">
										{game.tags.map((tag) => (
											<span
												key={tag}
												className="inline-block px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-mono border border-red-500/30"
											>
												{tag}
											</span>
										))}
									</div>
								)}
							</div>

							<div className="flex gap-2">
								<div className="flex items-center justify-between text-sm text-foreground/60 w-full">
									<div className="flex gap-4">
										<button
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleLike(game.game_id);
											}}
											className={`flex items-center gap-1 cursor-pointer ${likedGames.has(game.game_id)
												? 'text-red-500'
												: 'hover:text-foreground'
												}`}
											disabled={!isAuthenticated}
										>
											<svg
												className="w-4 h-4"
												fill={
													likedGames.has(game.game_id)
														? 'currentColor'
														: 'none'
												}
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
												/>
											</svg>
											<span>{game.likes_count || 0}</span>
										</button>
										<span className="flex items-center gap-1 cursor-default">
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>{game.plays_count || 0}</span>
										</span>
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											router.push(`/play?id=${game.game_id}`);
										}}
										className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded-md text-sm flex items-center justify-center text-background aspect-square cursor-pointer"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</button>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}