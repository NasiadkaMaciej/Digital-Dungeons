'use client';
import {useEffect} from 'react';
import {ensureBridge} from "@/app/utils/ensureBridge";

export default function BridgeProvider({ children }) {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await ensureBridge('RPGEditorBridge', '/rpg-editor-bridge.js');
                if (cancelled) return;

                window.RPGEditorBridge.configure({
                    getInitialData: () => ({
                        rooms: [
                            { id: '0,0', gx: 0, gy: 0, meta: { hasChest: true } },
                            { id: '1,0', gx: 1, gy: 0, meta: { entity: { type: 'monster', id: 'slime' } } },
                            { id: '0,1', gx: 0, gy: 1, meta: { conversationId: 'welcome_intro' } },
                        ],
                        selected: '0,0',
                    }),
                    onSelectionChange: (id, state) => console.log('[Map] selection:', id, state),
                    onRoomAdded: (room, state)     => console.log('[Map] added:', room, state),
                    onRoomDeleted: (id, state)     => console.log('[Map] deleted:', id, state),
                    onStateSnapshot: (state)       => console.log('[Map] snapshot:', state),
                });
            } catch (e) {
                console.warn('Failed to ensure RPGEditorBridge:', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return children;
}