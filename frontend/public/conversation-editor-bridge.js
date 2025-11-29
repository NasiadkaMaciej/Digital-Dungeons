/* eslint-disable no-unused-vars */
/**
 * Conversation Editor – Host Integration Bridge (v2)
 * --------------------------------------------------
 * Now models a tree explicitly: each node may have a parentId (its immediate parent
 * in the column to the left). Visual placement (gx, gy) is still provided for layout.
 *
 * Types:
 *   type NodeId = `${number},${number}`;
 *   interface Node {
 *     id: NodeId;       // "gx,gy"
 *     gx: number;       // column
 *     gy: number;       // row
 *     parentId?: NodeId | null; // optional parent of this node (must exist in nodes if provided)
 *     order?: number;   // optional sibling order hint under parent (lowest -> highest). gy usually suffices.
 *     meta?: { label?: string };
 *   }
 *   interface EditorState {
 *     nodes: Node[];
 *     selected?: NodeId | null;
 *   }
 *
 * Host callbacks (all optional):
 *   - getInitialData(): EditorState | null
 *   - onSelectionChange(selectedId: NodeId|null, state: EditorState): void
 *   - onNodeAdded(node: Node, state: EditorState): void
 *   - onNodeDeleted(nodeId: NodeId, state: EditorState): void
 *   - onStateSnapshot(state: EditorState): void
 */

(function (global) {
    const handlers = {
        getInitialData: null,
        onSelectionChange: null,
        onNodeAdded: null,
        onNodeDeleted: null,
        onStateSnapshot: null,
    };

    // lightweight event channels the editor subscribes to
    const visibilityListeners = new Set();   // (visible:boolean) => void
    const loadStateListeners  = new Set();   // (state: EditorState) => void
    
    // UI control handlers (registered by ConversationCanvas)
    let uiHandlers = { setVisible: null, replaceState: null };

    function validFnOrNull(f){ return typeof f === 'function' ? f : null; }
    function safeId(id){
        if (id == null) return null;
        if (typeof id === 'string' && /^-?\d+,-?\d+$/.test(id)) return id;
        throw new TypeError('NodeId must be "gx,gy" or null.');
    }
    function toInt(v,name){
        const n = Number(v);
        if (!Number.isFinite(n) || Math.trunc(n)!==n) throw new TypeError(`${name} must be an integer.`);
        return n;
    }
    function normaliseMeta(m){
        if (m == null) return undefined;
        const out = {};
        if ('label' in m) out.label = String(m.label);
        return Object.keys(out).length ? out : undefined;
    }
    function normaliseNode(n){
        if (!n || typeof n !== 'object') throw new TypeError('Node must be an object.');
        const gx = toInt(n.gx,'gx'), gy = toInt(n.gy,'gy');
        const id = (typeof n.id === 'string') ? n.id : `${gx},${gy}`;
        const node = {
            id,
            gx,
            gy,
            meta: normaliseMeta(n.meta),
        };
        if ('parentId' in n) node.parentId = (n.parentId == null ? null : safeId(n.parentId));
        if ('order' in n && n.order != null) node.order = Number(n.order);
        return node;
    }
    function normaliseState(s){
        if (s == null) return null;
        if (typeof s !== 'object') throw new TypeError('EditorState must be an object.');
        const nodes = Array.isArray(s.nodes) ? s.nodes.map(normaliseNode) : [];
        const selected = ('selected' in s) ? safeId(s.selected) : null;
        return { nodes, selected };
    }

    function configure(h) {
        if (!h || typeof h !== 'object') return;
        if ('getInitialData' in h) handlers.getInitialData = validFnOrNull(h.getInitialData);
        if ('onSelectionChange' in h) handlers.onSelectionChange = validFnOrNull(h.onSelectionChange);
        if ('onNodeAdded' in h) handlers.onNodeAdded = validFnOrNull(h.onNodeAdded);
        if ('onNodeDeleted' in h) handlers.onNodeDeleted = validFnOrNull(h.onNodeDeleted);
        if ('onStateSnapshot' in h) handlers.onStateSnapshot = validFnOrNull(h.onStateSnapshot);
    }

    function pullInitialData(){
        if (!handlers.getInitialData) return null;
        try { return normaliseState(handlers.getInitialData()); }
        catch (e) { console.warn('[ConversationBridge] getInitialData threw:', e); return null; }
    }
    function notifySelectionChange(id, state){
        if (!handlers.onSelectionChange) return;
        try { handlers.onSelectionChange(safeId(id), normaliseState(state)); }
        catch (e) { console.warn('[ConversationBridge] onSelectionChange threw:', e); }
    }
    function notifyNodeAdded(node, state){
        if (!handlers.onNodeAdded) return;
        try { handlers.onNodeAdded(normaliseNode(node), normaliseState(state)); }
        catch (e) { console.warn('[ConversationBridge] onNodeAdded threw:', e); }
    }
    function notifyNodeDeleted(id, state){
        if (!handlers.onNodeDeleted) return;
        try { handlers.onNodeDeleted(safeId(id), normaliseState(state)); }
        catch (e) { console.warn('[ConversationBridge] onNodeDeleted threw:', e); }
    }
    function notifyStateSnapshot(state){
        if (!handlers.onStateSnapshot) return;
        try { handlers.onStateSnapshot(normaliseState(state)); }
        catch (e) { console.warn('[ConversationBridge] onStateSnapshot threw:', e); }
    }

    // -------- Host controls (UI -> editor) --------
    /** 
     * Register UI control handlers from ConversationCanvas.
     * Expected: { setVisible: (visible:boolean|null) => void, replaceState: (state) => void }
     */
    function bindUI(h) {
        if (h && typeof h === 'object') {
            if (typeof h.setVisible === 'function') uiHandlers.setVisible = h.setVisible;
            if (typeof h.replaceState === 'function') uiHandlers.replaceState = h.replaceState;
        }
    }
    
    /** Show or hide the overlay without remounting. */
    function setVisibility(visible) {
        if (uiHandlers.setVisible) {
            try { uiHandlers.setVisible(!!visible); } catch (e) { console.warn('[Bridge] setVisible threw:', e); }
        }
        // legacy listener support
        for (const cb of visibilityListeners) {
            try { cb(!!visible); } catch (e) { /* noop */ }
        }
    }
    /** Convenience toggle. */
    function toggleVisibility() {
        if (uiHandlers.setVisible) {
            try { uiHandlers.setVisible(null); } catch (e) { console.warn('[Bridge] setVisible threw:', e); }
        }
        for (const cb of visibilityListeners) {
            try { cb('toggle'); } catch (e) { /* noop */ }
        }
    }
    /**
     * Push a full editor state (for a specific room's conversation) into the running sketch.
     * The sketch will replace its state without re-mounting.
     */
    function loadState(state) {
        const norm = normaliseState(state);
        if (uiHandlers.replaceState) {
            try { uiHandlers.replaceState(norm); } catch (e) { console.warn('[Bridge] replaceState threw:', e); }
        }
        // legacy listener support
        for (const cb of loadStateListeners) {
            try { cb(norm); } catch (e) { /* noop */ }
        }
    }

    // -------- Editor subscriptions (editor -> bridge) --------
        /** Editor calls this once to receive visibility changes. Returns unsubscribe. */
        function onVisibility(cb) {
                if (typeof cb !== 'function') return () => {};
                visibilityListeners.add(cb);
                return () => visibilityListeners.delete(cb);
            }
    /** Editor calls this once to receive incoming state loads. Returns unsubscribe. */
    function onLoadState(cb) {
        if (typeof cb !== 'function') return () => {};
        loadStateListeners.add(cb);
        return () => loadStateListeners.delete(cb);
    }

    const api = Object.freeze({
        configure,
        pullInitialData,
        notifySelectionChange,
        notifyNodeAdded,
        notifyNodeDeleted,
        notifyStateSnapshot,
        bindUI,
        setVisibility,
        toggleVisibility,
        loadState,
        onVisibility,
        onLoadState,
    });

    global.ConversationEditorBridge = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);