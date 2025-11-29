'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function EditorSidebar({ onSave, onLoad, onNew, currentGameId }) {
    const [selection, setSelection] = useState(null); // "gx,gy" or null
    const [snapshot, setSnapshot] = useState(null);   // latest editor state

    useEffect(() => {
        // Initialise from any existing globals
        setSelection(window.__editorSelection ?? null);
        setSnapshot(window.__editorSnapshot ?? null);

        const onSel = (e) => setSelection(e.detail?.id ?? null);
        const onSnap = (e) => setSnapshot(e.detail?.state ?? null);
        window.addEventListener('editor-selection-change', onSel);
        window.addEventListener('editor-state-snapshot', onSnap);
        return () => {
            window.removeEventListener('editor-selection-change', onSel);
            window.removeEventListener('editor-state-snapshot', onSnap);
        };
    }, []);

    const rooms = snapshot?.rooms ?? [];
    // Show global metadata when nothing is selected
    const effectiveSelectionId = selection ?? snapshot?.selected ?? null;
    const selectedRoom = effectiveSelectionId ? rooms.find(r => r.id === effectiveSelectionId) : null;
    const [descDraft, setDescDraft] = useState('');
    const [convDraft, setConvDraft] = useState('');
    const [hasChest, setHasChest] = useState(false);
    const [entities, setEntities] = useState([]);
    const [lastSyncedRoomId, setLastSyncedRoomId] = useState(null);

    // ----- Global Meta Draft State -----
    const globalMeta = snapshot?.globalMeta ?? { gameName: '', gameDescription: '', tags: [], entities: [], items: [] };
    const [gameNameDraft, setGameNameDraft] = useState(globalMeta.gameName || '');
    const [gameDescDraft, setGameDescDraft] = useState(globalMeta.gameDescription || '');
    const [tagsDraft, setTagsDraft] = useState(globalMeta.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [entitiesDraft, setEntitiesDraft] = useState(globalMeta.entities || []);
    const [itemsDraft, setItemsDraft] = useState(globalMeta.items || []);
    const [globalDirty, setGlobalDirty] = useState(false);

    useEffect(() => {
        // Only sync drafts when selection changes, not on every snapshot update
        if (effectiveSelectionId !== lastSyncedRoomId) {
            setDescDraft(selectedRoom?.meta?.description ?? '');
            setConvDraft(selectedRoom?.meta?.conversationId ?? '');
            setHasChest(selectedRoom?.meta?.hasChest ?? false);
            // Entities are now stored as array of IDs
            if (selectedRoom?.meta?.entities && Array.isArray(selectedRoom.meta.entities)) {
                setEntities(selectedRoom.meta.entities);
            } else {
                setEntities([]);
            }
            setLastSyncedRoomId(effectiveSelectionId);
        }
    }, [effectiveSelectionId, selectedRoom, lastSyncedRoomId]);

    // Sync global meta drafts when snapshot changes (and no room selected)
    useEffect(() => {
        setGameNameDraft(globalMeta.gameName || '');
        setGameDescDraft(globalMeta.gameDescription || '');
        setTagsDraft(globalMeta.tags || []);
        setEntitiesDraft(globalMeta.entities || []);
        setItemsDraft(globalMeta.items || []);
        setGlobalDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalMeta.gameName, globalMeta.gameDescription, JSON.stringify(globalMeta.tags), JSON.stringify(globalMeta.entities), JSON.stringify(globalMeta.items)]);

    function commitGlobalMeta() {
        if (typeof window !== 'undefined' && window.__editorSetGlobalMeta) {
            window.__editorSetGlobalMeta({
                gameName: gameNameDraft,
                gameDescription: gameDescDraft,
                tags: tagsDraft,
                entities: entitiesDraft,
                items: itemsDraft
            });
            setGlobalDirty(false);
        }
    }

    function addTag(e) {
        e.preventDefault();
        const t = tagInput.trim();
        if (!t) return;
        if (!tagsDraft.includes(t)) {
            const next = [...tagsDraft, t];
            setTagsDraft(next);
            setGlobalDirty(true);
        }
        setTagInput('');
    }

    function removeTag(idx) {
        const next = tagsDraft.filter((_, i) => i !== idx);
        setTagsDraft(next);
        setGlobalDirty(true);
    }

    const openConversationEditor = () => {
        try {
            if (!selectedRoom) return;
            const ctx = {
                roomId: selectedRoom.id,
                conversationId: selectedRoom.meta?.conversationId || 'none',
                isRepeatable: !!selectedRoom.meta?.conversationRepeatable
            };
            console.log('[EditorSidebar] Request open conversation editor context:', ctx);
            if (window.__setConvRoomContext) window.__setConvRoomContext(ctx);
            // Activate via bridge (will trigger loading logic in ConversationCanvas)
            window.ConversationEditorBridge?.setVisibility?.(true);
        } catch (e) {
            console.warn('Failed to open conversation editor:', e);
        }
    };

    return (
        <aside
            className="fixed right-0 top-16 bottom-0 w-[340px] border-l border-foreground/10 bg-background/95 backdrop-blur px-4 py-3 overflow-y-auto z-40 flex flex-col"
            aria-label="Editor sidebar"
        >
            <ActionBar {...{ onSave, onLoad, onNew, globalDirty, commitGlobalMeta, gameNameDraft, gameDescDraft, tagsDraft, snapshot, isAuthenticated: useAuth().isAuthenticated, currentGameId }} />
            {!selectedRoom ? (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Game Metadata</h2>
                    <QuickActions globalDirty={globalDirty} commitGlobalMeta={commitGlobalMeta} />
                    <AccordionSection title="Game Info" defaultOpen>
                        <label className="block mb-3">
                            <span className="text-xs uppercase tracking-wide text-foreground/50">Game Name</span>
                            <input
                                className="mt-1 w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                                value={gameNameDraft}
                                onChange={e => { setGameNameDraft(e.target.value); setGlobalDirty(true); }}
                                placeholder="Untitled Adventure"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs uppercase tracking-wide text-foreground/50">Game Description</span>
                            <textarea
                                className="mt-1 w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm h-24 resize-none focus:outline-none focus:ring focus:ring-indigo-500"
                                value={gameDescDraft}
                                onChange={e => { setGameDescDraft(e.target.value); setGlobalDirty(true); }}
                                placeholder="Short pitch / lore overview"
                            />
                        </label>
                    </AccordionSection>
                    <AccordionSection title="Tags">
                        <form onSubmit={addTag} className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    placeholder="Add tag and press Enter"
                                />
                                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-semibold">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {tagsDraft.map((t, i) => (
                                    <span key={t + i} className="px-2 py-1 bg-foreground/10 rounded text-xs flex items-center gap-1">
                                        {t}
                                        <button type="button" onClick={() => removeTag(i)} className="text-red-400 hover:text-red-300" title="Remove">×</button>
                                    </span>
                                ))}
                                {tagsDraft.length === 0 && <span className="text-xs text-foreground/40">No tags yet.</span>}
                            </div>
                        </form>
                    </AccordionSection>
                    <AccordionSection title="Entity Registry">
                        <EntityManager entitiesDraft={entitiesDraft} setEntitiesDraft={setEntitiesDraft} setGlobalDirty={setGlobalDirty} rooms={rooms} />
                    </AccordionSection>
                    <AccordionSection title="Item Registry">
                        <ItemsManager itemsDraft={itemsDraft} setItemsDraft={setItemsDraft} setGlobalDirty={setGlobalDirty} />
                    </AccordionSection>
                    <div className="text-xs text-foreground/50 space-y-1">
                        <p>Total Rooms: {rooms.length}</p>
                        <p>Starting Room: {rooms.find(r => r.meta?.isStart)?.id ?? 'not set'}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Room Metadata</h2>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-foreground/60">ID:</span><span className="font-mono">{selectedRoom.id}</span></div>
                        <div className="flex justify-between"><span className="text-foreground/60">Grid:</span><span className="font-mono">({selectedRoom.gx},{selectedRoom.gy})</span></div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-foreground/60 text-xs">Starting:</span>
                            {selectedRoom.meta?.isStart ? (
                                <span className="text-green-400 text-xs font-medium">Yes</span>
                            ) : (
                                <button
                                    onClick={() => window.__editorSetStartingRoom?.(selectedRoom.id)}
                                    className="px-2 py-0.5 text-xs rounded bg-purple-600 hover:bg-purple-700"
                                >Set as Starting Room</button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded resize-none text-sm"
                            rows={4}
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-foreground/50">Write a narrative or purpose for this room.</p>
                            <button
                                disabled={!selectedRoom || (selectedRoom?.meta?.description ?? '') === descDraft}
                                onClick={() => {
                                    if (!selectedRoom) return;
                                    window.__editorSetRoomMeta?.(selectedRoom.id, (meta) => ({
                                        ...meta,
                                        description: descDraft,
                                    }));
                                }}
                                className="px-2 py-1 text-xs font-medium rounded border border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700"
                            >Save</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasChest}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setHasChest(checked);
                                    if (!selectedRoom) return;
                                    window.__editorSetRoomMeta?.(selectedRoom.id, (meta) => ({
                                        ...meta,
                                        hasChest: checked,
                                    }));
                                }}
                                className="w-4 h-4 rounded"
                            />
                            <span>Has Chest</span>
                        </label>
                        <p className="text-xs text-foreground/50">Toggle whether this room contains a treasure chest.</p>
                    </div>
                    <RoomEntityPicker
                        entities={entities}
                        setEntities={setEntities}
                        selectedRoom={selectedRoom}
                        globalEntities={entitiesDraft}
                    />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Conversation</label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground/60">ID: {selectedRoom?.meta?.conversationId ?? 'none'}</span>
                                <button
                                    onClick={openConversationEditor}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium"
                                >Open Editor</button>
                            </div>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded text-sm"
                                placeholder="conversation id"
                                value={convDraft}
                                onChange={(e) => setConvDraft(e.target.value)}
                                onBlur={() => {
                                    if (!selectedRoom) return;
                                    window.__editorSetRoomMeta?.(selectedRoom.id, (meta) => ({
                                        ...meta,
                                        conversationId: convDraft || null,
                                    }));
                                }}
                            />
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={!!selectedRoom?.meta?.conversationRepeatable}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (!selectedRoom) return;
                                        window.__editorSetRoomMeta?.(selectedRoom.id, (meta) => ({
                                            ...meta,
                                            conversationRepeatable: checked,
                                        }));
                                    }}
                                    className="w-4 h-4 rounded"
                                />
                                <span>Repeatable conversation</span>
                            </label>
                            <p className="text-xs text-foreground/50">Set the conversation id and open the editor to edit content.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom clean metadata button removed; use QuickActions at top */}
        </aside>
    );
}

function AccordionSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <section className="border border-foreground/10 rounded">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-foreground/5 hover:bg-foreground/10 rounded-t"
                aria-expanded={open}
            >
                <span>{title}</span>
                <span className="text-foreground/50">{open ? '▾' : '▸'}</span>
            </button>
            {open && <div className="px-3 py-3">{children}</div>}
        </section>
    );
}

function QuickActions({ globalDirty, commitGlobalMeta }) {
    return (
        <div className="flex gap-2 mb-2">
            <button
                disabled={!globalDirty}
                onClick={commitGlobalMeta}
                className={`flex-1 px-3 py-2 rounded text-xs font-semibold ${globalDirty ? 'bg-green-600 hover:bg-green-500' : 'bg-foreground/10 text-foreground/40 cursor-not-allowed'}`}
            >{globalDirty ? 'Save Metadata' : 'Metadata Saved'}</button>
            <button
                onClick={() => {
                    if (confirm('Clear ALL metadata (rooms, entities, items, conversations, name/description/tags)?')) {
                        window.__editorCleanMetadata?.();
                    }
                }}
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-xs font-semibold"
            >Clean</button>
        </div>
    );
}

function ActionBar({ onSave, onLoad, onNew, globalDirty, commitGlobalMeta, gameNameDraft, gameDescDraft, tagsDraft, snapshot, isAuthenticated, currentGameId }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleInlineSave() {
        if (!isAuthenticated) {
            alert('You must be logged in to save games');
            return;
        }
        try {
            setSaving(true);
            setError('');
            if (globalDirty) commitGlobalMeta();
            const state = window.RPGEditorBridge?.pullStateSnapshot?.();
            if (!state || !state.rooms || state.rooms.length === 0) {
                setError('No rooms created. Add rooms before saving.');
                setSaving(false);
                return;
            }
            const title = gameNameDraft.trim() || 'Untitled Adventure';
            const description = gameDescDraft.trim();
            await onSave({ title, description, gameContent: state });
            alert('Game saved successfully!');
        } catch (e) {
            setError(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mb-4 space-y-2">
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        if (confirm('Start a new game? Unsaved changes will be lost.')) onNew?.();
                    }}
                    className="flex-1 px-3 py-2 rounded bg-foreground/10 hover:bg-foreground/20 text-xs font-semibold"
                    title="New Game"
                >New</button>
                <button
                    onClick={handleInlineSave}
                    disabled={!isAuthenticated || saving}
                    className="flex-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-semibold"
                    title="Save Game"
                >{saving ? 'Saving…' : 'Save'}</button>
                <button
                    onClick={onLoad}
                    disabled={!isAuthenticated}
                    className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-40 text-xs font-semibold"
                    title="Load Game"
                >Load</button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {currentGameId && <p className="text-[10px] text-foreground/40">Game ID: {currentGameId}</p>}
        </div>
    );
}

function EntityManager({ entitiesDraft, setEntitiesDraft, setGlobalDirty, rooms }) {
    const [newEntityId, setNewEntityId] = useState('');
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityType, setNewEntityType] = useState('monster');

    function addEntity(e) {
        e.preventDefault();
        const id = newEntityId.trim();
        const name = newEntityName.trim();
        if (!id || !name) return;
        if (entitiesDraft.some(ent => ent.id === id)) {
            alert('Entity ID already exists!');
            return;
        }
        const next = [...entitiesDraft, { id, name, type: newEntityType }];
        setEntitiesDraft(next);
        setGlobalDirty(true);
        setNewEntityId('');
        setNewEntityName('');
        setNewEntityType('monster');
    }

    function removeEntity(entityId) {
        const usedIn = rooms.filter(r => r.meta?.entities?.includes(entityId)).map(r => r.id);
        if (usedIn.length > 0) {
            if (!confirm(`This entity is used in ${usedIn.length} room(s): ${usedIn.join(', ')}.\n\nIt will be removed from all rooms. Continue?`)) {
                return;
            }
            // Remove from all rooms
            rooms.forEach(r => {
                if (r.meta?.entities?.includes(entityId)) {
                    const filtered = r.meta.entities.filter(eid => eid !== entityId);
                    window.__editorSetRoomMeta?.(r.id, meta => ({ ...meta, entities: filtered }));
                }
            });
        }
        const next = entitiesDraft.filter(e => e.id !== entityId);
        setEntitiesDraft(next);
        setGlobalDirty(true);
    }

    return (
        <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-foreground/50">Entity Registry</span>
            <form onSubmit={addEntity} className="space-y-2">
                <input
                    className="w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    value={newEntityId}
                    onChange={e => setNewEntityId(e.target.value)}
                    placeholder="Entity ID (e.g. slime1)"
                />
                <input
                    className="w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    value={newEntityName}
                    onChange={e => setNewEntityName(e.target.value)}
                    placeholder="Display name (e.g. Green Slime)"
                />
                <div className="flex gap-2">
                    <select
                        className="flex-1 px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                        value={newEntityType}
                        onChange={e => setNewEntityType(e.target.value)}
                    >
                        <option value="monster">Monster</option>
                        <option value="boss">Boss</option>
                        <option value="person">Person (NPC)</option>
                    </select>
                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold">Add</button>
                </div>
            </form>
            <div className="space-y-1 max-h-40 overflow-y-auto">
                {entitiesDraft.map(entity => (
                    <div key={entity.id} className="flex items-center justify-between p-2 bg-foreground/5 border border-foreground/10 rounded text-xs">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{entity.name}</div>
                            <div className="text-foreground/50 text-[10px]">{entity.id} • {entity.type}</div>
                        </div>
                        <button
                            onClick={() => removeEntity(entity.id)}
                            className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 rounded text-[10px]"
                        >Del</button>
                    </div>
                ))}
                {entitiesDraft.length === 0 && <p className="text-xs text-foreground/40">No entities defined yet.</p>}
            </div>
        </div>
    );
}

function RoomEntityPicker({ entities, setEntities, selectedRoom, globalEntities }) {
    const [showPicker, setShowPicker] = useState(false);

    function addEntityToRoom(entityId) {
        if (entities.includes(entityId)) return;
        const next = [...entities, entityId];
        setEntities(next);
        if (selectedRoom) {
            window.__editorSetRoomMeta?.(selectedRoom.id, meta => ({ ...meta, entities: next }));
        }
    }

    function removeEntityFromRoom(entityId) {
        const next = entities.filter(id => id !== entityId);
        setEntities(next);
        if (selectedRoom) {
            window.__editorSetRoomMeta?.(selectedRoom.id, meta => ({ ...meta, entities: next }));
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Entities in Room</label>
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium"
                >
                    {showPicker ? 'Close' : '+ Add Entity'}
                </button>
            </div>
            {showPicker && (
                <div className="p-2 bg-foreground/5 border border-foreground/10 rounded space-y-1 max-h-32 overflow-y-auto">
                    {globalEntities.filter(e => !entities.includes(e.id)).map(entity => (
                        <button
                            key={entity.id}
                            onClick={() => {
                                addEntityToRoom(entity.id);
                                setShowPicker(false);
                            }}
                            className="w-full text-left px-2 py-1.5 bg-background hover:bg-foreground/10 rounded text-xs flex justify-between items-center"
                        >
                            <span>{entity.name}</span>
                            <span className="text-foreground/50 text-[10px]">{entity.type}</span>
                        </button>
                    ))}
                    {globalEntities.filter(e => !entities.includes(e.id)).length === 0 && (
                        <p className="text-xs text-foreground/40 py-2">All entities already added or none available.</p>
                    )}
                </div>
            )}
            {entities.length === 0 ? (
                <p className="text-sm text-foreground/60">No entities in this room.</p>
            ) : (
                <div className="space-y-1">
                    {entities.map(entityId => {
                        const entity = globalEntities.find(e => e.id === entityId);
                        return (
                            <div key={entityId} className="flex items-center justify-between p-2 bg-foreground/5 border border-foreground/10 rounded text-xs">
                                <div className="flex-1">
                                    {entity ? (
                                        <>
                                            <div className="font-medium">{entity.name}</div>
                                            <div className="text-foreground/50 text-[10px]">{entity.type}</div>
                                        </>
                                    ) : (
                                        <div className="text-red-400">Unknown: {entityId}</div>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeEntityFromRoom(entityId)}
                                    className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 rounded text-[10px]"
                                >Remove</button>
                            </div>
                        );
                    })}
                </div>
            )}
            <p className="text-xs text-foreground/50">Add entities from the global registry to this room.</p>
        </div>
    );
}

function ItemsManager({ itemsDraft, setItemsDraft, setGlobalDirty }) {
    const [newItemId, setNewItemId] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');

    function addItem(e) {
        e.preventDefault();
        const id = newItemId.trim();
        const name = newItemName.trim();
        if (!id || !name) return;
        if (itemsDraft.some(item => item.id === id)) {
            alert('Item ID already exists!');
            return;
        }
        const next = [...itemsDraft, { id, name, description: newItemDesc.trim() }];
        setItemsDraft(next);
        setGlobalDirty(true);
        setNewItemId('');
        setNewItemName('');
        setNewItemDesc('');
    }

    function removeItem(itemId) {
        const next = itemsDraft.filter(i => i.id !== itemId);
        setItemsDraft(next);
        setGlobalDirty(true);
    }

    return (
        <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-foreground/50">Item Registry</span>
            <form onSubmit={addItem} className="space-y-2">
                <input
                    className="w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    value={newItemId}
                    onChange={e => setNewItemId(e.target.value)}
                    placeholder="Item ID (e.g. health_potion)"
                />
                <input
                    className="w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="Display name (e.g. Health Potion)"
                />
                <input
                    className="w-full px-2 py-1.5 bg-foreground/5 border border-foreground/10 rounded text-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    placeholder="Description (optional)"
                />
                <button type="submit" className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold">Add Item</button>
            </form>
            <div className="space-y-1 max-h-40 overflow-y-auto">
                {itemsDraft.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-foreground/5 border border-foreground/10 rounded text-xs">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-foreground/50 text-[10px] truncate">{item.id}{item.description ? ` • ${item.description}` : ''}</div>
                        </div>
                        <button
                            onClick={() => removeItem(item.id)}
                            className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 rounded text-[10px]"
                        >Del</button>
                    </div>
                ))}
                {itemsDraft.length === 0 && <p className="text-xs text-foreground/40">No items defined yet.</p>}
            </div>
        </div>
    );
}
