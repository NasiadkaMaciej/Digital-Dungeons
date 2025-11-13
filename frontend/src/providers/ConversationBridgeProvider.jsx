'use client';
import {useEffect} from 'react';
import {ensureBridge} from '@/app/utils/ensureBridge';

export default function ConversationBridgeProvider({ children }) {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // If you also extended the bridge with bindUI/setVisible/replaceState, this just ensures the core API is ready.
                await ensureBridge('ConversationEditorBridge', '/conversation-editor-bridge.js');
                if (cancelled) return;

                window.ConversationEditorBridge.configure({
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
                    onNodeAdded: (node, state)     => console.log('[Conv] added:', node, state),
                    onNodeDeleted: (id, state)     => console.log('[Conv] deleted:', id, state),
                    onStateSnapshot: (state)       => console.log('[Conv] snapshot:', state),
                });
            } catch (e) {
                console.warn('Failed to ensure ConversationEditorBridge:', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return children;
}