'use client';

import {useEffect, useRef, useState} from 'react';

export default function ConversationCanvas() {
    const containerRef = useRef(null);
    const p5Ref = useRef(null);
    const mountedRef = useRef(false);
    const [active, setActive] = useState(false);
    const pendingStateRef = useRef(null);       // queue for early replaceState calls

    // below the useState/useRef lines
    useEffect(() => {
        // expose input lock for other sketches
        window.__convActive = active;
        return () => {
            // on unmount, release the lock if we owned it
            if (window.__convActive) window.__convActive = false;
        };
    }, [active]);

    // Dev-only keyboard toggle (optional) -------------------------------------- DEBUG
    useEffect(() => {
        const onKey = (e) => {
            if (e.code === 'KeyC') {
                e.preventDefault();
                e.stopPropagation();
                setActive((v) => !v);
            }
        };
        window.addEventListener('keydown', onKey, { capture: true });
        return () => window.removeEventListener('keydown', onKey, { capture: true });
    }, []);
    // --------------------------------------------------------------------------------

    // Bind programmatic controls from the bridge
    useEffect(() => {
        const B = window.ConversationEditorBridge;
        if (!B?.bindUI) return;

        // Provide handlers to the bridge
        B.bindUI({
            // visible: true|false; null/undefined => toggle
            setVisible: (visible) => {
                setActive((prev) => (visible == null ? !prev : !!visible));
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
    }, []);

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
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: active ? 100 : -1, // stacking-only visibility
                pointerEvents: 'auto',
            }}
        />
    );
}