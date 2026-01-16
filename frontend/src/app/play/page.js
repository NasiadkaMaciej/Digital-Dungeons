"use client";

import GameConsole from '@/components/GameConsole';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { gamesApi } from '@/lib/api';

function PlayPageContent() {
	const searchParams = useSearchParams();
	const gameId = searchParams.get('id');
	const [gameData, setGameData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!gameId) {
			setError('No game ID provided.');
			setLoading(false);
			return;
		}
		setLoading(true);
		gamesApi.getGameById(gameId)
			.then((data) => {
				setGameData(data.game_content || data);
				setLoading(false);
			})
			.catch((err) => {
				setError('Failed to load game.');
				setLoading(false);
			});
	}, [gameId]);

	if (loading) {
		return <div className="text-center text-white mt-10">Loading game...</div>;
	}
	if (error) {
		return <div className="text-center text-red-500 mt-10">{error}</div>;
	}
	if (!gameData) {
		return <div className="text-center text-red-500 mt-10">Game not found.</div>;
	}

	return (
		<div className="fixed inset-0 z-[999999] bg-black overflow-hidden" style={{ position: 'fixed' }}>
			<GameConsole initialData={gameData} />
		</div>
	);
}

export default function PlayPage() {
	return (
		<Suspense fallback={<div className="text-center text-white mt-10">Loading...</div>}>
			<PlayPageContent />
		</Suspense>
	);
}