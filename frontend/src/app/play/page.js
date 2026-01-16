"use client";

import GameConsole from '@/components/GameConsole';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import { gamesApi, playthroughsApi } from '@/lib/api';

function PlayPageContent() {
	const searchParams = useSearchParams();
	const gameId = searchParams.get('id');
	const [gameData, setGameData] = useState(null);
	const [playthrough, setPlaythrough] = useState(null);
	const [initialState, setInitialState] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const loadAbortRef = useRef(null);

	useEffect(() => {
		if (!gameId) {
			setError('No game ID provided.');
			setLoading(false);
			return;
		}

		// Abort previous load if switching games
		if (loadAbortRef.current) {
			loadAbortRef.current.abort();
		}

		const abortController = new AbortController();
		loadAbortRef.current = abortController;

		const load = async () => {
			try {
				setLoading(true);
				const data = await gamesApi.getGameById(gameId);
				if (abortController.signal.aborted) return;
				setGameData(data.game_content || data);
				// Continue or create playthrough on enter
				try {
					const pt = await playthroughsApi.continue(gameId);
					if (abortController.signal.aborted) return;
					const playObj = pt.playthrough || pt; // support both response shapes
					setPlaythrough(playObj);
					// If backend stored game state, use it to resume
					if (playObj && playObj.game_state) {
						setInitialState(playObj.game_state);
					}
				} catch (e) {
					// Non-blocking: gameplay can continue without persisted playthrough
					if (!abortController.signal.aborted) {
						console.warn('Playthrough continue failed:', e);
					}
				}
				if (!abortController.signal.aborted) {
					setLoading(false);
				}
			} catch (err) {
				if (!abortController.signal.aborted) {
					setError('Failed to load game.');
					setLoading(false);
				}
			}
		};
		load();

		return () => {
			abortController.abort();
		};
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

	const handleSave = async (snapshot) => {
		// Persist progress if playthrough exists
		try {
			if (playthrough?.playthrough_id || playthrough?.id) {
				const id = playthrough.playthrough_id ?? playthrough.id;
				await playthroughsApi.update(id, { gameState: snapshot, status: 'in_progress' });
			}
		} catch (e) {
			console.warn('Failed to save playthrough:', e);
		}
	};

	return (
		<div className="fixed inset-0 z-[999999] bg-black overflow-hidden" style={{ position: 'fixed' }}>
			<GameConsole
				initialData={gameData}
				initialState={initialState}
				onSave={handleSave}
				exitTo={`/game/${gameId}`}
			/>
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