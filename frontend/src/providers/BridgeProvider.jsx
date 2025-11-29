'use client';
import {useEffect} from 'react';
import {ensureBridge} from "@/app/utils/ensureBridge";

export default function BridgeProvider({ children, initialData = null }) {
    useEffect(() => {
        let cancelled = false;
        console.log('[BridgeProvider] Mounting/updating with initialData:', initialData);
        (async () => {
            try {
                await ensureBridge('RPGEditorBridge', '/rpg-editor-bridge.js');
                if (cancelled) return;

                window.RPGEditorBridge.configure({
                    getInitialData: () => {
                        console.log('[BridgeProvider] getInitialData called, returning:', initialData);
                        // If we have initialData from props, use it
                        if (initialData) {
                            console.log('[BridgeProvider] Rooms in initialData:', initialData.rooms);
                            // Expose for consumers that may need to read before first snapshot propagates
                            try { window.__initialGameData = initialData; } catch {}
                            // Force no selection on initial load so global metadata shows first
                            return { ...initialData, selected: null };
                        }
                        // Otherwise return default example data
                        return {
                            rooms: [
                                { id: '0,0', gx: 0, gy: 0, meta: { hasChest: true, description: 'The starting chamber.', entities: ['slime1'] } },
                                { id: '1,0', gx: 1, gy: 0, meta: { entities: ['slime1', 'goblin1'], description: 'A slimy lair.' } },
                                { id: '0,1', gx: 0, gy: 1, meta: { conversationId: 'welcome_intro', description: 'An NPC awaits.', entities: ['shopkeeper1'] } },
                            ],
                            selected: null,
                            globalMeta: {
                                gameName: 'Sample Dungeon',
                                gameDescription: 'A small example dungeon to get you started.',
                                tags: ['demo','starter'],
                                entities: [
                                    { id: 'slime1', type: 'monster', name: 'Green Slime' },
                                    { id: 'goblin1', type: 'monster', name: 'Cave Goblin' },
                                    { id: 'shopkeeper1', type: 'person', name: 'Village Shopkeeper' }
                                ],
                                items: [
                                    { id: 'health_potion', name: 'Health Potion', description: 'Restores 50 HP' },
                                    { id: 'rusty_sword', name: 'Rusty Sword', description: 'A basic melee weapon' },
                                    { id: 'gold_coin', name: 'Gold Coin', description: 'Currency for trading' }
                                ]
                            }
                        };
                    },
                    onSelectionChange: (id, state) => {
                        try {
                            // Trust the provided id unless it's falsy; only nullify when explicit deselection
                            // If rooms are provided, optionally validate; otherwise don't discard a valid id
                            let effectiveId = id || null;
                            if (effectiveId && Array.isArray(state?.rooms)) {
                                const hasMatch = state.rooms.some(r => r.id === effectiveId);
                                if (!hasMatch) effectiveId = null;
                            }
                            window.__editorSelection = effectiveId;
                            const ev = new CustomEvent('editor-selection-change', { detail: { id: effectiveId, state } });
                            window.dispatchEvent(ev);
                        } catch (e) { console.warn(e); }
                    },
                    onRoomAdded: (room, state)     => {
                        try {
                            window.__editorSnapshot = state;
                            const ev = new CustomEvent('editor-state-snapshot', { detail: { state } });
                            window.dispatchEvent(ev);
                        } catch {}
                        console.log('[Map] added:', room, state);
                    },
                    onRoomDeleted: (id, state)     => {
                        try {
                            window.__editorSnapshot = state;
                            const ev = new CustomEvent('editor-state-snapshot', { detail: { state } });
                            window.dispatchEvent(ev);
                        } catch {}
                        console.log('[Map] deleted:', id, state);
                    },
                    onStateSnapshot: (state)       => {
                        try {
                            window.__editorSnapshot = state;
                            const ev = new CustomEvent('editor-state-snapshot', { detail: { state } });
                            window.dispatchEvent(ev);
                        } catch (e) { console.warn(e); }
                    },
                });
            } catch (e) {
                console.warn('Failed to ensure RPGEditorBridge:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [initialData]);

    return children;
}