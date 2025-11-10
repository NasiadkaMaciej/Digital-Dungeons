'use client';

import {useEffect} from 'react';

export default function BridgeProvider({ children }) {
    useEffect(() => {
        const Bridge = window.RPGEditorBridge;
        if (!Bridge?.configure) return;

        Bridge.configure({
            getInitialData: () => ({
                rooms: [
                    { id: '0,0', gx: 0, gy: 0, meta: { hasChest: true } },
                    { id: '1,0', gx: 1, gy: 0, meta: { entity: { type: 'monster', id: 'slime' } } },
                    { id: '0,1', gx: 0, gy: 1, meta: { conversationId: 'welcome_intro' } },
                ],
                selected: '0,0',
            }),
            onSelectionChange: (selectedId, state) => console.log('Selection changed:', selectedId, state),
            onRoomAdded: (room, state) => console.log('Room added:', room, state),
            onRoomDeleted: (roomId, state) => console.log('Room deleted:', roomId, state),
            onStateSnapshot: (state) => console.log('Snapshot:', state),
        });
    }, []);

    return children;
}