'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RPGEditorCanvas from '@/components/RPGEditorCanvas.jsx';
// EditorToolbar removed; actions migrated into EditorSidebar
import BridgeProvider from "@/providers/BridgeProvider";
import NoScroll from "@/providers/NoScroll";
import ConversationCanvas from "@/components/ConversationCanvas";
import ConversationBridgeProvider from "@/providers/ConversationBridgeProvider";
import EditorSidebar from "@/components/EditorSidebar";
import { gamesApi } from '@/lib/api';

export default function EditorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentGameId, setCurrentGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [convEditorActive, setConvEditorActive] = useState(false);

    useEffect(() => {
        const gameId = searchParams.get('gameId');
        if (gameId) {
            loadGame(gameId);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

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
            setGameData(game.game_content);
        } catch (err) {
            alert('Failed to load game: ' + err.message);
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
        if (confirm('Start a new game? Unsaved changes will be lost.')) {
            setCurrentGameId(null);
            setGameData(null);
            // Reset the canvas to initial sample data immediately without navigation
            try { window.__editorResetToInitial?.(); } catch {}
            // Optionally refresh route to clear any query params
            router.replace('/editor');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-foreground/60">Loading game...</p>
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
                    <ConversationCanvas onActiveChange={setConvEditorActive} />
                </NoScroll>
            </ConversationBridgeProvider>
        </BridgeProvider>
    );
}