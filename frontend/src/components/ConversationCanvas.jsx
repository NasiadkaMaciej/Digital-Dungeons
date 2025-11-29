'use client';

import {useEffect, useRef, useState} from 'react';

export default function ConversationCanvas({ onActiveChange }) {
    const containerRef = useRef(null);
    const p5Ref = useRef(null);
    const mountedRef = useRef(false);
    const [active, setActive] = useState(false);
    const pendingStateRef = useRef(null);       // queue for early replaceState calls
    const [roomContext, setRoomContext] = useState(null); // { roomId, conversationId, isRepeatable }
    const storedStatesRef = useRef({}); // conversationId -> { nodes, selected }

    // Load a state into the sketch (helper)
    const loadStateIntoSketch = (state) => {
        const p = p5Ref.current;
        if (!p) return;
        if (p.loadConversationState) {
            try { p.loadConversationState(state); } catch (e) { console.warn('Failed loadConversationState:', e); }
        } else {
            pendingStateRef.current = state;
        }
        try { p.redraw?.(); } catch {}
    };

    // below the useState/useRef lines
    useEffect(() => {
        // expose input lock for other sketches
        window.__convActive = active;
        // expose room context setter
        window.__setConvRoomContext = (ctx) => setRoomContext(ctx);
        // notify parent of active state change
        if (onActiveChange) onActiveChange(active);
        
        // Trigger redraw when becoming active
        if (active && p5Ref.current) {
            try {
                if (p5Ref.current.isLooping && !p5Ref.current.isLooping()) p5Ref.current.loop();
                p5Ref.current.redraw();
            } catch (e) { console.warn('Failed to redraw conversation canvas:', e); }
        }
        
        return () => {
            // on unmount, release the lock if we owned it
            if (window.__convActive) window.__convActive = false;
            delete window.__setConvRoomContext;
        };
    }, [active, onActiveChange]);

    // When active & roomContext changes, load / seed per-conversation state
    useEffect(() => {
        if (!active) return;
        const cid = roomContext?.conversationId;
        if (!cid) return; // no conversation id -> leave as-is
        // 1) Prefer stored state in memory
        const inMemory = storedStatesRef.current[cid];
        if (inMemory) { loadStateIntoSketch(inMemory); return; }

        // 2) Check room meta for persisted conversationState (from prior save)
        try {
            const snapshot = window.__editorSnapshot;
            const rooms = snapshot?.rooms || [];
            const roomId = roomContext?.roomId;
            const room = rooms.find(r => r.id === roomId);
            const persisted = room?.meta?.conversationState;
            if (persisted && Array.isArray(persisted.nodes)) {
                storedStatesRef.current[cid] = persisted;
                loadStateIntoSketch(persisted);
                return;
            }
        } catch (e) { console.warn('ConversationCanvas read persisted failed:', e); }

        // 3) Seed new conversation
        const seed = (cid === 'welcome_intro') ? {
            nodes: [
                { id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: 'Welcome: Root' } },
                { id: '1,0', gx: 1, gy: 0, parentId: '0,0', meta: { label: 'Greeting Option' } },
                { id: '1,1', gx: 1, gy: 1, parentId: '0,0', meta: { label: 'Ask for Help' } },
            ],
            selected: '0,0'
        } : {
            nodes: [ { id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: `Root: ${cid}` } } ],
            selected: '0,0'
        };
        storedStatesRef.current[cid] = seed;
        loadStateIntoSketch(seed);
    }, [active, roomContext]);

    // Listen for editor state snapshots and persist current conversation state
    useEffect(() => {
        const onState = (e) => {
            const cid = roomContext?.conversationId;
            if (!cid) return;
            const state = e.detail?.state;
            if (state && state.nodes) {
                storedStatesRef.current[cid] = state; // persist
            }
        };
        window.addEventListener('conversation-editor-state', onState);
        return () => window.removeEventListener('conversation-editor-state', onState);
    }, [roomContext]);

    // Bind programmatic controls from the bridge
    useEffect(() => {
        let disposed = false;
        let attempts = 0;
        const bind = () => {
            if (disposed) return;
            const B = window.ConversationEditorBridge;
            if (!B?.bindUI) {
                // Retry until bridge script loads & exposes bindUI
                if (attempts < 40) { // ~6s worst-case (40 * 150ms)
                    attempts++;
                    setTimeout(bind, 150);
                } else {
                    console.warn('[ConversationCanvas] Failed to bind UI after retries');
                }
                return;
            }
            // Provide handlers to the bridge
            B.bindUI({
                // visible: true|false; null/undefined => toggle
                setVisible: (visible) => {
                    console.log('[ConversationCanvas] setVisible called with:', visible);
                    setActive((prev) => {
                        const next = (visible == null ? !prev : !!visible);
                        console.log('[ConversationCanvas] Setting active from', prev, 'to', next);
                        return next;
                    });
                },
                // state: { nodes, selected }
                replaceState: (state) => {
                    const p = p5Ref.current;
                    if (p?.loadConversationState) {
                        p.loadConversationState(state);
                    } else {
                        // not mounted yet — queue it
                        pendingStateRef.current = state;
                    }
                },
            });
            console.log('[ConversationCanvas] UI bound to ConversationEditorBridge');
        };
        bind();
        return () => { disposed = true; };
    }, []);

    // ESC key to close conversation editor
    useEffect(() => {
        if (!active) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setActive(false);
            }
        };
        window.addEventListener('keydown', onKey, { capture: true });
        return () => window.removeEventListener('keydown', onKey, { capture: true });
    }, [active]);

    // Mount p5 exactly once
    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        let disposed = false;
        (async () => {
            const mod = await import('p5');
            const P5 = mod.default || mod;
            const { conversationSketchFactory } = await import('../p5/conversationSketchFactory.js');
            if (disposed || !containerRef.current) return;

            p5Ref.current = new P5(conversationSketchFactory, containerRef.current);

            // Apply any queued state from replaceState() that may have arrived early
            if (pendingStateRef.current && p5Ref.current?.loadConversationState) {
                try {
                    p5Ref.current.loadConversationState(pendingStateRef.current);
                } finally {
                    pendingStateRef.current = null;
                }
            }
        })();

        return () => {
            disposed = true;
            try {
                p5Ref.current?.remove();
            } finally {
                p5Ref.current = null;
                mountedRef.current = false;
            }
        };
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: active ? 100 : -1,
                    pointerEvents: active ? 'auto' : 'none',
                    backgroundColor: active ? '#0f0f10' : 'transparent',
                    visibility: active ? 'visible' : 'hidden',
                }}
            />
            {active && (
                <div className="fixed top-20 right-4 z-[101] flex flex-col gap-2">
                    <div className="bg-background/95 backdrop-blur border border-foreground/20 rounded-lg px-4 py-2 text-sm">
                        <div className="font-semibold mb-1">Conversation Editor</div>
                        <div className="text-xs space-y-0.5 text-foreground/70">
                            <div>Room: <span className="font-mono text-foreground">{roomContext?.roomId || 'unknown'}</span></div>
                            <div>Conversation ID: <span className="font-mono text-foreground">{roomContext?.conversationId || 'none'}</span></div>
                            <div>Repeatable: <span className={roomContext?.isRepeatable ? 'text-green-400' : 'text-foreground/50'}>{roomContext?.isRepeatable ? 'Yes' : 'No'}</span></div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const cid = roomContext?.conversationId;
                            const roomId = roomContext?.roomId;
                            if (!cid || cid === 'none' || !roomId) { alert('Set a conversation ID first.'); return; }
                            let state = window.__conversationExportState?.();
                            if (!state || !Array.isArray(state.nodes)) {
                                console.warn('[ConversationCanvas] exportState unavailable, attempting fallback');
                                const fallback = storedStatesRef.current[cid];
                                if (fallback && Array.isArray(fallback.nodes)) {
                                    state = fallback;
                                }
                            }
                            if (!state || !Array.isArray(state.nodes)) { alert('No conversation state to save.'); return; }
                            // persist locally (ensure clone to avoid mutation surprises)
                            storedStatesRef.current[cid] = { nodes: [...state.nodes], selected: state.selected };
                            // write onto room meta for inclusion in main game snapshot
                            window.__editorSetRoomMeta?.(roomId, meta => ({
                                ...meta,
                                conversationId: cid,
                                conversationState: { nodes: [...state.nodes], selected: state.selected },
                                conversationRepeatable: !!roomContext?.isRepeatable
                            }));
                            alert('Conversation saved to room.');
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-semibold shadow-lg"
                        title="Save conversation to room"
                    >Save Conversation</button>
                    <button
                        onClick={(e) => {
                            // Prevent underlying sidebar buttons (e.g. New Game) from receiving this click
                            e.stopPropagation();
                            e.preventDefault();
                            // Defer deactivation so the original click does not fall through after DOM changes
                            setTimeout(() => setActive(false), 0);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded text-sm font-semibold shadow-lg"
                        title="Close Conversation Editor (ESC)"
                    >
                        ✕ Close Editor
                    </button>
                </div>
            )}
        </>
    );
}