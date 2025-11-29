/* eslint-disable no-unused-vars */
/**
 * RPG Editor – Host Integration Bridge
 * ------------------------------------
 * Purpose: decouple the p5.js sketch from the host front end via a tiny callback API.
 *
 * Load order:
 *   <script src="rpg-editor-bridge.js"></script>
 *   <script src="p5.min.js"></script>
 *   <script src="your-editor-sketch.js"></script>
 *
 * Host usage (in your app shell, BEFORE the editor script runs):
 *   RPGEditorBridge.configure({
 *     getInitialData: () => ({
 *       rooms: [{ id: "0,0", gx: 0, gy: 0 }],
 *       selected: "0,0"
 *     }),
 *     onSelectionChange: (selectedId, state) => { ... },
 *     onRoomAdded: (room, state) => { ... },
 *     onRoomDeleted: (roomId, state) => { ... },
 *     onStateSnapshot: (state) => { ... }
 *   });
 *
 * The p5 sketch will:
 *   - Call RPGEditorBridge.pullInitialData() once during setup() to seed state.
 *   - Call RPGEditorBridge.notifySelectionChange(selectedId, state) when selection changes.
 *   - Call RPGEditorBridge.notifyRoomAdded(room, state) whenever a room is created.
 *   - Call RPGEditorBridge.notifyRoomDeleted(roomId, state) whenever a room is deleted.
 *   - Call RPGEditorBridge.notifyStateSnapshot(state) whenever you want to broadcast full state.
 */

/**
 * @typedef {`${number},${number}`} RoomId
 *
 * @typedef {Object} Room
 * @property {RoomId} id       - Stable identifier "gx,gy".
 * @property {number} gx       - Grid X coordinate (integer).
 * @property {number} gy       - Grid Y coordinate (integer).
 * @property {Object} [meta]   - Optional metadata for future UI (non-render-critical here).
 * @property {boolean} [meta.hasChest]
 * @property {{ type:'monster'|'boss'|'person', id?:string }} [meta.entity]
 * @property {string|null} [meta.conversationId]
 * @property {string} [meta.notes]
 *
 * @typedef {Object} EditorState
 * @property {Room[]} rooms           - Flat list of rooms (neighbours are implicit by shared grid).
 * @property {RoomId|null} [selected] - Currently selected room id, or null.
 */

(function (global) {
    /** @type {{ getInitialData: (() => (EditorState|null)) | null,
     *            onSelectionChange: ((selectedId: RoomId|null, state: EditorState) => void) | null,
     *            onRoomAdded: ((room: Room, state: EditorState) => void) | null,
     *            onRoomDeleted: ((roomId: RoomId, state: EditorState) => void) | null,
     *            onStateSnapshot: ((state: EditorState) => void) | null }} */
    const handlers = {
        getInitialData: null,
        onSelectionChange: null,
        onRoomAdded: null,
        onRoomDeleted: null,
        onStateSnapshot: null,
    };

    /**
     * Configure host callbacks.
     * Call this exactly once, before the p5 editor initialises.
     * Any missing handler is treated as a no-op.
     * @param {Partial<typeof handlers>} h
     */
    function configure(h) {
        if (!h || typeof h !== 'object') return;
        if ('getInitialData' in h) handlers.getInitialData = validFnOrNull(h.getInitialData);
        if ('onSelectionChange' in h) handlers.onSelectionChange = validFnOrNull(h.onSelectionChange);
        if ('onRoomAdded' in h) handlers.onRoomAdded = validFnOrNull(h.onRoomAdded);
        if ('onRoomDeleted' in h) handlers.onRoomDeleted = validFnOrNull(h.onRoomDeleted);
        if ('onStateSnapshot' in h) handlers.onStateSnapshot = validFnOrNull(h.onStateSnapshot);
    }

    /**
     * p5 editor calls this during setup() to obtain the initial map state (or null).
     * This is deliberately synchronous (host should already have the data in memory).
     * @returns {EditorState|null}
     */
    function pullInitialData() {
        if (!handlers.getInitialData) return null;
        try {
            const data = handlers.getInitialData();
            return normaliseEditorState(data);
        } catch (e) {
            console.warn('[RPGEditorBridge] getInitialData threw:', e);
            return null;
        }
    }

    /**
     * Notify the host that the active selection has changed.
     * @param {RoomId|null} selectedId
     * @param {EditorState} state
     */
    function notifySelectionChange(selectedId, state) {
        if (!handlers.onSelectionChange) return;
        try {
            handlers.onSelectionChange(safeRoomId(selectedId), normaliseEditorState(state));
        } catch (e) {
            console.warn('[RPGEditorBridge] onSelectionChange threw:', e);
        }
    }

    /**
     * Notify the host that a room has been added.
     * @param {Room} room
     * @param {EditorState} state
     */
    function notifyRoomAdded(room, state) {
        if (!handlers.onRoomAdded) return;
        try {
            handlers.onRoomAdded(normaliseRoom(room), normaliseEditorState(state));
        } catch (e) {
            console.warn('[RPGEditorBridge] onRoomAdded threw:', e);
        }
    }

    /**
     * Notify the host that a room has been deleted.
     * @param {RoomId} roomId
     * @param {EditorState} state
     */
    function notifyRoomDeleted(roomId, state) {
        if (!handlers.onRoomDeleted) return;
        try {
            handlers.onRoomDeleted(safeRoomId(roomId), normaliseEditorState(state));
        } catch (e) {
            console.warn('[RPGEditorBridge] onRoomDeleted threw:', e);
        }
    }

    /**
     * Notify the host with a full, current snapshot of the canvas/editor.
     * You may call this:
     *  - after any mutation (add, delete, etc.),
     *  - on an interval (debounced), or
     *  - on explicit user action (e.g., "Save/Export").
     * @param {EditorState} state
     */
    function notifyStateSnapshot(state) {
        if (!handlers.onStateSnapshot) return;
        try {
            handlers.onStateSnapshot(normaliseEditorState(state));
        } catch (e) {
            console.warn('[RPGEditorBridge] onStateSnapshot threw:', e);
        }
    }

    /**
     * Host can call this to request current state from the canvas.
     * The p5 sketch should set this via RPGEditorBridge.setStatePuller(fn).
     * @returns {EditorState|null}
     */
    let statePuller = null;
    function setStatePuller(fn) {
        statePuller = validFnOrNull(fn);
    }
    function pullStateSnapshot() {
        if (!statePuller) {
            console.warn('[RPGEditorBridge] No statePuller configured');
            return null;
        }
        try {
            return normaliseEditorState(statePuller());
        } catch (e) {
            console.warn('[RPGEditorBridge] statePuller threw:', e);
            return null;
        }
    }

    // ---------- Normalisation & safeguards ----------

    /** @param {any} f */ function validFnOrNull(f) { return (typeof f === 'function') ? f : null; }

    /** @param {any} id */ function safeRoomId(id) {
        if (id == null) return null;
        if (typeof id === 'string' && /^-?\d+,-?\d+$/.test(id)) return id;
        throw new TypeError('RoomId must be a string like "gx,gy" or null.');
    }

    /** @param {any} r */ function normaliseRoom(r) {
        if (!r || typeof r !== 'object') throw new TypeError('Room must be an object.');
        const gx = toInt(r.gx, 'gx');
        const gy = toInt(r.gy, 'gy');
        const id = (typeof r.id === 'string') ? r.id : `${gx},${gy}`;
        return {
            id,
            gx,
            gy,
            meta: normaliseMeta(r.meta),
        };
    }

    /** @param {any} m */ function normaliseMeta(m) {
        if (m == null) return undefined;
        const out = {};
        if ('hasChest' in m) out.hasChest = !!m.hasChest;
        if ('description' in m) out.description = String(m.description ?? '');
        if ('isStart' in m) out.isStart = !!m.isStart; // starting room flag
        if ('conversationRepeatable' in m) out.conversationRepeatable = !!m.conversationRepeatable; // allow replay/shop reuse

        // Support both single entity (old) and entities array (new)
        // Entities are now stored as array of entity IDs (strings)
        if ('entities' in m && Array.isArray(m.entities)) {
            out.entities = m.entities.map(e => {
                // New format: just IDs
                if (typeof e === 'string') return e;
                // Old format: objects with type - migrate to ID if present
                if (e && typeof e === 'object' && e.id) return String(e.id);
                return null;
            }).filter(Boolean);
            if (out.entities.length === 0) delete out.entities;
        } else if ('entity' in m && m.entity != null) {
            // Migrate old single entity format
            if (m.entity.id) {
                out.entities = [String(m.entity.id)];
            }
        }

        if ('conversationId' in m) out.conversationId = (m.conversationId == null ? null : String(m.conversationId));
        if ('notes' in m) out.notes = String(m.notes);
        return Object.keys(out).length ? out : undefined;
    }

    /** @param {any} s */ function normaliseEditorState(s) {
        if (s == null) return null;
        if (typeof s !== 'object') throw new TypeError('EditorState must be an object or null.');
        const rooms = Array.isArray(s.rooms) ? s.rooms.map(normaliseRoom) : [];
        const selected = ('selected' in s) ? safeRoomId(s.selected) : null;
        // Global meta passthrough (shallow) - only simple scalars/strings
        const globalMetaRaw = s.globalMeta && typeof s.globalMeta === 'object' ? s.globalMeta : {};
        const globalMeta = {};
        if ('gameName' in globalMetaRaw) globalMeta.gameName = String(globalMetaRaw.gameName || '');
        if ('gameDescription' in globalMetaRaw) globalMeta.gameDescription = String(globalMetaRaw.gameDescription || '');
        if ('tags' in globalMetaRaw && Array.isArray(globalMetaRaw.tags)) {
            globalMeta.tags = globalMetaRaw.tags.map(t => String(t)).filter(t => t.length);
        }
        if ('entities' in globalMetaRaw && Array.isArray(globalMetaRaw.entities)) {
            globalMeta.entities = globalMetaRaw.entities.map(e => {
                if (!e || typeof e !== 'object') return null;
                const et = e.type;
                if (et !== 'monster' && et !== 'boss' && et !== 'person') return null;
                return {
                    id: String(e.id || ''),
                    type: et,
                    name: String(e.name || '')
                };
            }).filter(e => e && e.id);
        }
        if ('items' in globalMetaRaw && Array.isArray(globalMetaRaw.items)) {
            globalMeta.items = globalMetaRaw.items.map(i => {
                if (!i || typeof i !== 'object') return null;
                return {
                    id: String(i.id || ''),
                    name: String(i.name || ''),
                    description: String(i.description || '')
                };
            }).filter(i => i && i.id);
        }
        return { rooms, selected, globalMeta };
    }

    /** @param {any} v @param {string} name */
    function toInt(v, name) {
        const n = Number(v);
        if (!Number.isFinite(n) || Math.trunc(n) !== n) {
            throw new TypeError(`${name} must be an integer.`);
        }
        return n;
    }

    // ---------- Public API ----------

    const api = Object.freeze({
        configure,
        pullInitialData,
        notifySelectionChange,
        notifyRoomAdded,
        notifyRoomDeleted,
        notifyStateSnapshot,
        setStatePuller,
        pullStateSnapshot,
    });

    // UMD-lite: expose as global and CommonJS (if present)
    global.RPGEditorBridge = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);