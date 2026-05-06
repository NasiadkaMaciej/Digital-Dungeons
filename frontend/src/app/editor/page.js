'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RPGEditorCanvas from '@/components/RPGEditorCanvas.jsx';
// EditorToolbar removed; actions migrated into EditorSidebar
import BridgeProvider from "@/providers/BridgeProvider";
import NoScroll from "@/providers/NoScroll";
import ConversationCanvas from "@/components/ConversationCanvas";
import ConversationBridgeProvider from "@/providers/ConversationBridgeProvider";
import EditorSidebar from "@/components/EditorSidebar";
import { gamesApi } from '@/lib/api';

function EditorPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [currentGameId, setCurrentGameId] = useState(null);
	const [gameData, setGameData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [convEditorActive, setConvEditorActive] = useState(false);
	const [loadError, setLoadError] = useState('');

	useEffect(() => {
		const gameId = searchParams.get('gameId');
		if (gameId) {
			loadGame(gameId);
		} else {
			setLoading(false);
		}
	}, [searchParams]);

	// Reset editor canvas when game data changes
	useEffect(() => {
		if (gameData && window.__editorResetToInitial) {
			// Small delay to ensure bridge is configured
			setTimeout(() => {
				try { window.__editorResetToInitial(); } catch { }
			}, 100);
		}
	}, [gameData]);

	// Force dark theme while on the editor page to avoid light-mode rendering issues
	useEffect(() => {
		try {
			const root = document.documentElement;
			const prev = {
				classList: Array.from(root.classList),
				localStorage: localStorage.getItem('theme')
			};
			// enforce dark mode
			root.classList.remove('light');
			root.classList.add('dark');
			localStorage.setItem('theme', 'dark');
			return () => {
				// restore previous classes
				root.className = prev.classList.join(' ');
				if (prev.localStorage != null) localStorage.setItem('theme', prev.localStorage);
			};
		} catch (e) {
			// ignore – defensive
		}
	}, []);

	const loadGame = async (gameId) => {
		try {
			const game = await gamesApi.getGameById(gameId);
			setCurrentGameId(game.game_id);
			// game_content may arrive as a JSON string from the API; parse defensively
			let content = game.game_content;
			if (typeof content === 'string') {
				try {
					content = JSON.parse(content);
				} catch {
					content = { rooms: [], selected: null, globalMeta: {} };
				}
			}
			if (!content || typeof content !== 'object') content = { rooms: [], selected: null, globalMeta: {} };
			if (!Array.isArray(content.rooms)) content.rooms = [];
			setGameData(content);
		} catch (err) {
			setLoadError('Failed to load game: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async ({ title, description, gameContent }) => {
		if (currentGameId) {
			// Update existing game
			await gamesApi.updateGame(currentGameId, {
				title,
				description,
				game_content: gameContent,
			});
		} else {
			// Create new game
			const response = await gamesApi.createGame({
				title,
				description,
				gameContent,
			});
			setCurrentGameId(response.gameId);
			router.push(`/editor?gameId=${response.gameId}`);
		}
	};

	const handleLoad = () => {
		router.push('/profile');
	};

	const handleNew = () => {
		// Confirmation is handled inline by ActionBar — call directly
		setCurrentGameId(null);
		setGameData(null);
		setLoadError('');
		try { window.__editorResetToInitial?.(); } catch { }
		router.replace('/editor');
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-foreground/60">Loading game...</p>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<p className="text-red-400">{loadError}</p>
				<button
					onClick={() => { setLoadError(''); router.replace('/editor'); }}
					className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-semibold"
				>Start New Game</button>
			</div>
		);
	}

	return (
		<BridgeProvider initialData={gameData}>
			<ConversationBridgeProvider>
				<NoScroll>

					{/* Keep map & sidebar mounted to preserve state; just hide visually */}
					<div style={{ display: convEditorActive ? 'none' : 'block' }}>
						<RPGEditorCanvas />
						<EditorSidebar onSave={handleSave} onLoad={handleLoad} onNew={handleNew} currentGameId={currentGameId} />
					</div>
					{/* Conversations overlay */}
					<ConversationCanvas onActiveChange={setConvEditorActive} gameId={currentGameId} />
				</NoScroll>
			</ConversationBridgeProvider>
		</BridgeProvider>
	);
}

export default function EditorPage() {
	return (
		<Suspense fallback={
			<div className="flex items-center justify-center h-screen">
				<p className="text-foreground/60">Loading...</p>
			</div>
		}>
			<EditorPageContent />
		</Suspense>
	);
}