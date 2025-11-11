'use client';

import {useLayoutEffect} from 'react';

export default function ConversationBridgeProvider({ children }) {
    useLayoutEffect(() => {
        const B = window.ConversationEditorBridge;
        if (!B?.configure) return;

        B.configure({
            getInitialData: () => ({
                nodes: [
                    { id: '0,0', gx: 0, gy: 0, parentId: null,  meta: { label: 'Root prompt' } },
                    { id: '1,0', gx: 1, gy: 0, parentId: '0,0', meta: { label: 'Response A' } },
                    { id: '1,1', gx: 1, gy: 1, parentId: '0,0', meta: { label: 'Response B' } },
                    { id: '2,0', gx: 2, gy: 0, parentId: '1,0', meta: { label: 'Follow-up A1' } },
                ],
                selected: '0,0',
            }),
            onSelectionChange: (id, state) => console.log('[Conv] selection:', id, state),
            onNodeAdded: (node, state)   => console.log('[Conv] added:', node, state),
            onNodeDeleted: (id, state)   => console.log('[Conv] deleted:', id, state),
            onStateSnapshot: (state)     => console.log('[Conv] snapshot:', state),
        });
    }, []);

    return children;
}