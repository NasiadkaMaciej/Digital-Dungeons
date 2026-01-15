'use client';

import { useEffect, useRef, useState } from 'react';

export default function ConversationCanvas({ onActiveChange, gameId }) {
	const containerRef = useRef(null);
	const p5Ref = useRef(null);
	const mountedRef = useRef(false);
	const [active, setActive] = useState(false);
	const pendingStateRef = useRef(null);       // queue for early replaceState calls
	const [roomContext, setRoomContext] = useState(null); // { roomId, conversationId, isRepeatable }
	const storedStatesRef = useRef({}); // cache: key (conversationId or namespaced) -> { nodes, selected }
	const lastGameIdRef = useRef(gameId);
	const roomContextRef = useRef(roomContext); // always up-to-date context for closures

	useEffect(() => { roomContextRef.current = roomContext; }, [roomContext]);

	// Load a state into the sketch (helper)
	const loadStateIntoSketch = (state) => {
		const p = p5Ref.current;
		if (!p) return;
		if (p.loadConversationState) {
			try {
				console.log('[ConversationCanvas] loadStateIntoSketch applying nodes:', state?.nodes?.length || 0);
				p.loadConversationState(state);
				try {
					const cnt = p.__getNodeCount?.();
					console.log('[ConversationCanvas] sketch now has nodes:', cnt);
				} catch { }
				// Ensure nodes are visible: recenter camera after load
				try { p.__centre?.(); } catch { }
				// Ensure full-screen size after visibility toggles
				try { p.resizeCanvas?.(window.innerWidth, window.innerHeight); } catch { }
				try { p.loop?.(); } catch { }
				try { p.redraw?.(); } catch { }
			} catch (e) { console.warn('Failed loadConversationState:', e); }
		} else {
			pendingStateRef.current = state;
		}
		try { p.redraw?.(); } catch { }
	};

	// below the useState/useRef lines
	useEffect(() => {
		// expose input lock for other sketches
		window.__convActive = active;
		// expose room context setter
		window.__setConvRoomContext = (ctx) => setRoomContext(ctx);
		// expose conversation editor opener
		window.__openConversationEditor = (conversationId, roomId) => {
			setRoomContext({ conversationId, roomId, isRepeatable: false });
			setActive(true);
		};
		// notify parent of active state change
		if (onActiveChange) onActiveChange(active);

		// Trigger redraw when becoming active
		if (active && p5Ref.current) {
			try {
				const p = p5Ref.current;
				try { p.frameRate?.(60); } catch { }
				try { p.loop?.(); } catch { }
				try { p.redraw?.(); } catch { }
				setTimeout(() => { try { p.loop?.(); p.redraw?.(); } catch { } }, 50);
				setTimeout(() => { try { p.loop?.(); p.redraw?.(); } catch { } }, 150);
			} catch { }
		} else if (!active && p5Ref.current) {
			// No-op on deactivate
		}

		return () => {
			// on unmount, release the lock if we owned it
			if (window.__convActive) window.__convActive = false;
			delete window.__setConvRoomContext;
			delete window.__openConversationEditor;
		};
	}, [active, onActiveChange]);

	// Helper to build cache key (namespace by gameId to avoid collisions if not reset yet)
	const cacheKeyFor = (cid) => (gameId ? `${gameId}::${cid}` : cid);

	// Reset cache when game changes (avoid cross-game bleed)
	useEffect(() => {
		if (lastGameIdRef.current !== gameId) {
			storedStatesRef.current = {};
			pendingStateRef.current = null;
			lastGameIdRef.current = gameId;
		}
	}, [gameId]);

	// Force p5 to reinitialize when gameId changes to avoid stale canvas
	useEffect(() => {
		// Skip on first mount (p5 will mount naturally below)
		if (lastGameIdRef.current === gameId) return;
		// Game changed: tear down old p5 and reset mount flag so it recreates
		if (p5Ref.current) {
			try {
				console.log('[ConversationCanvas] Game changed, removing old p5 instance');
				p5Ref.current.remove();
			} catch (e) {
				console.warn('[ConversationCanvas] Failed to remove old p5:', e);
			} finally {
				p5Ref.current = null;
			}
		}
		// Reset mount flag so the mount effect below will recreate p5
		mountedRef.current = false;
	}, [gameId]);

	// When active & roomContext changes, load / seed per-conversation state
	useEffect(() => {
		if (!active) return;
		const cid = roomContext?.conversationId;
		if (!cid) return; // no conversation id -> leave as-is

		let attempts = 0;
		let cancelled = false;

		const tryLoad = () => {
			if (cancelled) return;
			// 1) Prefer stored state in memory (previous edits during this session)
			const key = cacheKeyFor(cid);
			const inMemory = storedStatesRef.current[key];
			if (inMemory && Array.isArray(inMemory.nodes)) { loadStateIntoSketch(inMemory); return; }

			// 2) Check room meta for persisted conversationState (from prior save)
			try {
				const snapshot = window.__editorSnapshot;
				const rooms = snapshot?.rooms || [];
				const roomId = roomContext?.roomId;
				const room = rooms.find(r => r.id === roomId);
				const persisted = room?.meta?.conversationState;
				if (persisted && Array.isArray(persisted.nodes)) {
					storedStatesRef.current[key] = persisted;
					loadStateIntoSketch(persisted);
					return;
				}
				// 2a) Fallback to initial game data if snapshot not yet populated
				const initial = window.__initialGameData;
				const iRooms = initial?.rooms || [];
				const iRoom = iRooms.find(r => r.id === roomId);
				const iPersisted = iRoom?.meta?.conversationState;
				if (iPersisted && Array.isArray(iPersisted.nodes)) {
					storedStatesRef.current[key] = iPersisted;
					console.log('[ConversationCanvas] Loaded persisted from initial game data for', cid, 'nodes:', iPersisted.nodes.length);
					loadStateIntoSketch(iPersisted);
					return;
				}
				// If we have a snapshot AND no persisted state, seed immediately (avoid waiting all retries)
				if (snapshot && rooms.length && !persisted) {
					const seed = (cid === 'welcome_intro') ? {
						nodes: [
							{ id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: 'Welcome: Root' } },
							{ id: '1,0', gx: 1, gy: 0, parentId: '0,0', meta: { label: 'Greeting Option' } },
							{ id: '1,1', gx: 1, gy: 1, parentId: '0,0', meta: { label: 'Ask for Help' } },
						],
						selected: '0,0'
					} : {
						nodes: [{ id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: `Root: ${cid}` } }],
						selected: '0,0'
					};
					storedStatesRef.current[key] = seed;
					loadStateIntoSketch(seed);
					return;
				}
			} catch (e) { /* retry will handle timing */ }

			// 3) Retry briefly to wait for snapshot propagation
			if (attempts < 10) { // ~1.5s total (10 * 150ms)
				attempts++;
				setTimeout(tryLoad, 150);
				return;
			}

			// 4) Seed new conversation after retries
			const seed = (cid === 'welcome_intro') ? {
				nodes: [
					{ id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: 'Welcome: Root' } },
					{ id: '1,0', gx: 1, gy: 0, parentId: '0,0', meta: { label: 'Greeting Option' } },
					{ id: '1,1', gx: 1, gy: 1, parentId: '0,0', meta: { label: 'Ask for Help' } },
				],
				selected: '0,0'
			} : {
				nodes: [{ id: '0,0', gx: 0, gy: 0, parentId: null, meta: { label: `Root: ${cid}` } }],
				selected: '0,0'
			};
			storedStatesRef.current[key] = seed;
			loadStateIntoSketch(seed);
		};

		tryLoad();
		return () => { cancelled = true; };
	}, [active, roomContext, cacheKeyFor]);

	// Listen for editor state snapshots and persist current conversation state
	useEffect(() => {
		const onState = (e) => {
			const cid = roomContext?.conversationId;
			if (!cid) return;
			const state = e.detail?.state;
			if (state && state.nodes) {
				storedStatesRef.current[cacheKeyFor(cid)] = state; // persist with namespaced key
			}
		};
		window.addEventListener('conversation-editor-state', onState);
		return () => window.removeEventListener('conversation-editor-state', onState);
	}, [roomContext, cacheKeyFor]);

	// Bind programmatic controls from the bridge
	// Bind programmatic controls once; use refs for fresh context to avoid stale closure
	useEffect(() => {
		let disposed = false;
		let attempts = 0;
		const bind = () => {
			if (disposed) return;
			const B = window.ConversationEditorBridge;
			if (!B?.bindUI) {
				if (attempts < 40) {
					attempts++;
					setTimeout(bind, 150);
				} else {
					console.warn('[ConversationCanvas] Failed to bind UI after retries');
				}
				return;
			}
			B.bindUI({
				setVisible: (visible) => {
					console.log('[ConversationCanvas] setVisible called with:', visible);
					setActive((prev) => {
						const next = (visible == null ? !prev : !!visible);
						console.log('[ConversationCanvas] Setting active from', prev, 'to', next);
						return next;
					});
					// On activation, reset p5 draw state defensively and force redraw
					setTimeout(() => {
						try {
							const p = p5Ref.current;
							if (!p) return;
							if (visible) {
								// Reset any lingering rendering state between sessions
								try { p.blendMode?.(p.BLEND); } catch { }
								try { p.resetMatrix?.(); } catch { }
								try { p.loop?.(); } catch { }
								try { p.__centre?.(); } catch { }
							}
							p.redraw?.();
						} catch { }
					}, 50);
				},
				replaceState: (state) => {
					console.log('[ConversationCanvas] replaceState received nodes:', state?.nodes?.length || 0, 'selected:', state?.selected);
					const p = p5Ref.current;
					if (p?.loadConversationState) {
						try { p.loadConversationState(state); } catch (e) { console.warn('Failed loadConversationState in replaceState:', e); }
					} else {
						pendingStateRef.current = state;
					}
					const cid = roomContextRef.current?.conversationId; // latest context
					if (cid && state && Array.isArray(state.nodes)) {
						storedStatesRef.current[cacheKeyFor(cid)] = state;
						console.log('[ConversationCanvas] Stored state for', cid, 'nodes:', state.nodes.length);
					} else {
						console.log('[ConversationCanvas] Skipped storing state; cid:', cid, 'state nodes valid:', Array.isArray(state?.nodes));
					}
				},
			});
			console.log('[ConversationCanvas] UI bound to ConversationEditorBridge');
		};
		bind();
		return () => { disposed = true; };
	}, [cacheKeyFor]);

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
			if (disposed || !containerRef.current) { return; }

			p5Ref.current = new P5(conversationSketchFactory, containerRef.current);
			// Ensure canvas is visible and fills container
			try {
				const cnv = p5Ref.current?.canvas;
				if (cnv) {
					cnv.style.position = 'absolute';
					cnv.style.inset = '0';
					cnv.style.width = '100%';
					cnv.style.height = '100%';
					cnv.style.display = 'block';
				}
			} catch { }
			try { p5Ref.current?.loop?.(); } catch { }

			// Apply any queued state from replaceState() that may have arrived early
			if (pendingStateRef.current && p5Ref.current?.loadConversationState) {
				try {
					p5Ref.current.loadConversationState(pendingStateRef.current);
				} finally {
					pendingStateRef.current = null;
				}
			}

			// After mount, force a resize to current container bounds
			try {
				const rect = containerRef.current?.getBoundingClientRect?.();
				if (rect) {
					p5Ref.current?.resizeCanvas?.(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
				} else {
					p5Ref.current?.resizeCanvas?.(window.innerWidth, window.innerHeight);
				}
				p5Ref.current?.redraw?.();
			} catch { }
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
					zIndex: active ? 9999 : -1,
					pointerEvents: active ? 'auto' : 'none',
					backgroundColor: active ? '#0f0f10' : 'transparent',
					visibility: active ? 'visible' : 'hidden',
					overflow: 'hidden',
				}}
			/>
			{active && (
				<div className="fixed top-20 right-4 flex flex-col gap-2" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
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