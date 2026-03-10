'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import EditConversationNodeModal from '@/components/EditConversationNodeModal';

export default function ConversationCanvas({ onActiveChange, gameId }) {
	const containerRef = useRef(null);
	const p5Ref = useRef(null);
	const mountedRef = useRef(false);
	const [active, setActive] = useState(false);
	const pendingStateRef = useRef(null);
	const [roomContext, setRoomContext] = useState(null);
	const storedStatesRef = useRef({});
	const lastGameIdRef = useRef(gameId);
	const roomContextRef = useRef(roomContext);

	const [editingNode, setEditingNode] = useState(null);
	const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);

	useEffect(() => {
		roomContextRef.current = roomContext;
	}, [roomContext]);

	const cacheKeyFor = useCallback((cid) => (gameId ? `${gameId}::${cid}` : cid), [gameId]);

	const loadStateIntoSketch = useCallback((state) => {
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
				try { p.__centre?.(); } catch { }
				try { p.resizeCanvas?.(window.innerWidth, window.innerHeight); } catch { }
				try { p.loop?.(); } catch { }
				try { p.redraw?.(); } catch { }
			} catch (e) {
				console.warn('Failed loadConversationState:', e);
			}
		} else {
			pendingStateRef.current = state;
		}

		try { p.redraw?.(); } catch { }
	}, []);

	useEffect(() => {
		window.__convActive = active;
		window.__setConvRoomContext = (ctx) => setRoomContext(ctx);
		window.__openConversationEditor = (conversationId, roomId) => {
			setRoomContext({ conversationId, roomId, isRepeatable: false });
			setActive(true);
		};

		if (onActiveChange) onActiveChange(active);

		if (active && p5Ref.current) {
			try {
				const p = p5Ref.current;
				try { p.frameRate?.(60); } catch { }
				try { p.loop?.(); } catch { }
				try { p.redraw?.(); } catch { }
				setTimeout(() => { try { p.loop?.(); p.redraw?.(); } catch { } }, 50);
				setTimeout(() => { try { p.loop?.(); p.redraw?.(); } catch { } }, 150);
			} catch { }
		}

		return () => {
			if (window.__convActive) window.__convActive = false;
			delete window.__setConvRoomContext;
			delete window.__openConversationEditor;
		};
	}, [active, onActiveChange]);

	useEffect(() => {
		if (lastGameIdRef.current !== gameId) {
			storedStatesRef.current = {};
			pendingStateRef.current = null;
			lastGameIdRef.current = gameId;
		}
	}, [gameId]);

	useEffect(() => {
		if (lastGameIdRef.current === gameId) return;

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

		mountedRef.current = false;
	}, [gameId]);

	useEffect(() => {
		if (!active) return;
		const cid = roomContext?.conversationId;
		if (!cid) return;

		let attempts = 0;
		let cancelled = false;

		const tryLoad = () => {
			if (cancelled) return;

			const key = cacheKeyFor(cid);
			const inMemory = storedStatesRef.current[key];
			if (inMemory && Array.isArray(inMemory.nodes)) {
				loadStateIntoSketch(inMemory);
				return;
			}

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
			} catch (e) { }

			if (attempts < 10) {
				attempts++;
				setTimeout(tryLoad, 150);
				return;
			}

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
	}, [active, roomContext, cacheKeyFor, loadStateIntoSketch]);

	useEffect(() => {
		const onState = (e) => {
			const cid = roomContextRef.current?.conversationId;
			if (!cid) return;
			const state = e.detail?.state;
			if (state && state.nodes) {
				storedStatesRef.current[cacheKeyFor(cid)] = state;
			}
		};

		window.addEventListener('conversation-editor-state', onState);
		return () => window.removeEventListener('conversation-editor-state', onState);
	}, [cacheKeyFor]);

	useEffect(() => {
		const onEditNode = (e) => {
			const node = e.detail?.node;
			if (!node) return;
			setEditingNode(node);
			setIsNodeModalOpen(true);
		};

		window.addEventListener('conversation-node-edit', onEditNode);
		return () => window.removeEventListener('conversation-node-edit', onEditNode);
	}, []);

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

					setTimeout(() => {
						try {
							const p = p5Ref.current;
							if (!p) return;
							if (visible) {
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
						try {
							p.loadConversationState(state);
						} catch (e) {
							console.warn('Failed loadConversationState in replaceState:', e);
						}
					} else {
						pendingStateRef.current = state;
					}

					const cid = roomContextRef.current?.conversationId;
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

	useEffect(() => {
		if (!active) return;

		const onKey = (e) => {
			if (e.key === 'Escape') {
				if (isNodeModalOpen) return;
				e.preventDefault();
				setActive(false);
			}
		};

		window.addEventListener('keydown', onKey, { capture: true });
		return () => window.removeEventListener('keydown', onKey, { capture: true });
	}, [active, isNodeModalOpen]);

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

			if (pendingStateRef.current && p5Ref.current?.loadConversationState) {
				try {
					p5Ref.current.loadConversationState(pendingStateRef.current);
				} finally {
					pendingStateRef.current = null;
				}
			}

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

	const handleCloseNodeModal = () => {
		setIsNodeModalOpen(false);
		setEditingNode(null);
	};

	const handleSaveNodeLabel = (nextLabel) => {
		if (!editingNode?.id) return;

		const p = p5Ref.current;
		const cid = roomContextRef.current?.conversationId;

		try {
			if (p?.updateConversationNodeLabel) {
				const ok = p.updateConversationNodeLabel(editingNode.id, nextLabel);
				if (!ok) {
					console.warn('[ConversationCanvas] updateConversationNodeLabel returned false for node:', editingNode.id);
				}
			} else {
				console.warn('[ConversationCanvas] Sketch does not expose updateConversationNodeLabel');
			}

			if (cid) {
				const key = cacheKeyFor(cid);
				const prev = storedStatesRef.current[key];

				if (prev?.nodes) {
					storedStatesRef.current[key] = {
						...prev,
						nodes: prev.nodes.map((n) =>
							n.id === editingNode.id
								? {
									...n,
									meta: {
										...(n.meta || {}),
										label: nextLabel,
									},
								}
								: n
						),
					};
				}
			}

			const exported = window.__conversationExportState?.();
			if (cid && exported?.nodes) {
				storedStatesRef.current[cacheKeyFor(cid)] = exported;
			}

			try { p?.redraw?.(); } catch { }

			handleCloseNodeModal();
		} catch (err) {
			console.error('[ConversationCanvas] Failed updating node label:', err);
		}
	};

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
							if (!cid || cid === 'none' || !roomId) {
								alert('Set a conversation ID first.');
								return;
							}

							let state = window.__conversationExportState?.();
							if (!state || !Array.isArray(state.nodes)) {
								console.warn('[ConversationCanvas] exportState unavailable, attempting fallback');
								const fallback = storedStatesRef.current[cacheKeyFor(cid)];
								if (fallback && Array.isArray(fallback.nodes)) {
									state = fallback;
								}
							}

							if (!state || !Array.isArray(state.nodes)) {
								alert('No conversation state to save.');
								return;
							}

							storedStatesRef.current[cacheKeyFor(cid)] = { nodes: [...state.nodes], selected: state.selected };

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
					>
						Save Conversation
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setTimeout(() => setActive(false), 0);
						}}
						className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded text-sm font-semibold shadow-lg"
						title="Close Conversation Editor (ESC)"
					>
						✕ Close Editor
					</button>
				</div>
			)}

			<EditConversationNodeModal
				isOpen={isNodeModalOpen}
				node={editingNode}
				onClose={handleCloseNodeModal}
				onSave={handleSaveNodeLabel}
			/>
		</>
	);
}