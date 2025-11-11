// Conversation Editor – p5 Instance Mode (tree-ish, folder-like UI)
// Behaviour:
// - A node's first child is created via RIGHT "+" (only shown when it has 0 children)
// - If a node is itself a child, and it's the bottom-most among its siblings, it shows a BOTTOM "+" to append a new sibling below.
// - Parent connects to all its direct children in the next column via a horizontal->vertical bus.

const NODE_W = 220;
const NODE_H = 60;
const CELL_X_GAP = 70;   // horizontal gutter between columns
const CELL_Y_GAP = 30;   // vertical gutter between stacked nodes
const BG = '#0f0f10';
const NODE_FILL = '#1b1b1d';
const NODE_STROKE = '#7ec3ff';
const NODE_SELECTED = '#ffd74a';
const GRID = '#222';
const PLUS_FILL = '#232323';
const PLUS_STROKE = '#9ee8a8';
const PLUS_HOVER = '#ffffff';
const PLUS_SIZE = 18;
const EDGE = 2;
const DELETE_BADGE_SIZE = 14;
const DELETE_BADGE_COLOR = '#ff6b6b';

let disposed = false;

export const conversationSketchFactory = (p) => {
    // camera
    let cam = { x: 0, y: 0, z: 1, minZ: 0.4, maxZ: 3 };

    // state
    /** key "gx,gy" -> { gx, gy, selected:boolean, meta:{label?:string}, parent?:key } */
    const nodes = new Map();
    /** child index: parentKey -> Set(childKey) */
    const children = new Map();
    /** reverse index: childKey -> parentKey */
    const parentOf = new Map();

    // Parent outline/bus colours (non-persistent)
    const parentColor = new Map();
    function randColour() {
        const h = Math.floor(Math.random() * 360);
        return `hsl(${h} 70% 60%)`;
    }
    function colourForParent(pk) {
        if (!parentColor.has(pk)) parentColor.set(pk, randColour());
        return parentColor.get(pk);
    }

    // hover info
    let hovered = { type: null, gx: 0, gy: 0, side: null }; // type: 'node'|'plusR'|'plusB'|'delete'|'plus-center'|null
    let isPanning = false;
    const panAnchor = { x: 0, y: 0 };
    const camAnchor = { x: 0, y: 0 };

    // lifecycle
    p.setup = () => {
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.elt.id = 'conversationCanvas';
        p.pixelDensity(window.devicePixelRatio || 1);
        centre();

        // seed
        const seed = (window.ConversationEditorBridge?.pullInitialData?.() ?? null);
        if (seed?.nodes?.length) {
            // create nodes first
            for (const n of seed.nodes) {
                const k = key(n.gx, n.gy);
                nodes.set(k, { gx: n.gx, gy: n.gy, selected: false, meta: n.meta ?? {} });
            }
            // parenting pass:
            // 1) explicit parentId from seed if present
            // 2) otherwise: if a node exists at (gx-1, gy), treat it as parent
            if (seed?.nodes?.length) {
                // map for quick lookup by id
                const byId = new Map(seed.nodes.map(nn => [ (typeof nn.id==='string'? nn.id : `${nn.gx},${nn.gy}`), nn ]));
                for (const n of nodes.values()) {
                    const nid = key(n.gx, n.gy);
                    const raw = byId.get(nid);
                    if (raw && raw.parentId != null) {
                        const pk = raw.parentId;
                        if (nodes.has(pk)) linkParent(pk, nid);
                        continue;
                    }
                    const guess = key(n.gx - 1, n.gy);
                    if (nodes.has(guess)) linkParent(guess, nid);
                }
            }
            for (const [pk, set] of children.entries()) {
                if (set && set.size) colourForParent(pk);
            }
            if (seed.selected) {
                const [sx, sy] = seed.selected.split(',').map(Number);
                selectOnly(sx, sy);
            }
        }

        // prevent context menu on canvas
        const c = p.canvas;
        p.__conv_ctx = (e) => e.preventDefault();
        if (c) c.addEventListener('contextmenu', p.__conv_ctx, { capture: true });

        // expose to React wrapper (imperative)
        p.loadConversationState = (state) => {
            loadFromState(state);
            try { p.redraw(); } catch {}
        };

        // robust panning with pointer events
        if (c) {
            const rectOf = () => c.getBoundingClientRect();
            const onDown = (e) => {
                if (inputsLocked()) return;
                if (e.button === 2 || e.button === 1 || (e.buttons & 0b110)) {
                    isPanning = true;
                    const r = rectOf();
                    panAnchor.x = e.clientX - r.left; panAnchor.y = e.clientY - r.top;
                    camAnchor.x = cam.x; camAnchor.y = cam.y;
                    try { c.setPointerCapture(e.pointerId); } catch {}
                    e.preventDefault();
                }
            };
            const onMove = (e) => {
                if (inputsLocked()) return;
                if (!isPanning) return;
                const r = rectOf();
                const cx = e.clientX - r.left, cy = e.clientY - r.top;
                cam.x = camAnchor.x + (cx - panAnchor.x);
                cam.y = camAnchor.y + (cy - panAnchor.y);
                e.preventDefault();
            };
            const onUp = (e) => {
                if (inputsLocked()) return;
                if (!isPanning) return;
                isPanning = false;
                try { c.releasePointerCapture(e.pointerId); } catch {}
                e.preventDefault();
            };
            p.__pe = { onDown, onMove, onUp };
            c.addEventListener('pointerdown', onDown, { passive:false });
            c.addEventListener('pointermove', onMove, { passive:false });
            c.addEventListener('pointerup', onUp, { passive:false });
            c.addEventListener('pointercancel', onUp, { passive:false });
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        if (nodes.size === 0) centre();
    };

    p.draw = () => {
        if (disposed) return;
        if (isLocked()) { centre(); isPanning = false; }
        p.background(BG);

        p.push();
        p.translate(cam.x, cam.y); p.scale(cam.z);

        drawGrid();

        const view = boundsWorld();
        const viewRect = { x: view.left, y: view.top, w: view.right - view.left, h: view.bottom - view.top };

        // connectors: draw parent->children buses behind nodes
        for (const [pk, childSet] of children.entries()) {
            const parent = nodes.get(pk); if (!parent || !childSet?.size) continue;
            const rrP = rect(parent.gx, parent.gy);
            // collect children (sort by gy for nice vertical spine)
            const childNodes = [...childSet].map(k => nodes.get(k)).filter(Boolean).sort((a,b)=>a.gy-b.gy);
            if (!childNodes.length) continue;
            const centers = childNodes.map(cn => {
                const rr = rect(cn.gx, cn.gy);
                return { x: rr.x, cx: rr.x, cy: rr.y + rr.h/2 }; // we'll enter from left edge
            });
            const spineTop = Math.min(...centers.map(c=>c.cy));
            const spineBot = Math.max(...centers.map(c=>c.cy));
            const x1 = rrP.x + rrP.w;          // parent right edge
            const spineX = x1 + CELL_X_GAP/2;  // mid gutter
            const col = colourForParent(pk);
            p.stroke(col); p.strokeWeight(EDGE / cam.z);
            // parent to spine
            p.line(x1, rrP.y + rrP.h/2, spineX, rrP.y + rrP.h/2);
            // vertical spine
            p.line(spineX, spineTop, spineX, spineBot);
            // ticks to each child
            for (const cn of childNodes) {
                const rrC = rect(cn.gx, cn.gy);
                p.line(spineX, rrC.y + rrC.h/2, rrC.x, rrC.y + rrC.h/2);
            }
        }

        // nodes
        for (const n of nodes.values()) {
            const rr = rect(n.gx, n.gy);
            if (!intersect(rr, viewRect)) continue;

            const kNode = key(n.gx, n.gy);
            const isParent = children.has(kNode) && children.get(kNode)?.size;
            const outline = n.selected ? NODE_SELECTED : (isParent ? colourForParent(kNode) : NODE_STROKE);
            p.stroke(outline);
            p.strokeWeight(EDGE / cam.z);
            p.fill(NODE_FILL);
            p.rect(rr.x, rr.y, rr.w, rr.h, 6 / cam.z);

            drawLabel(n, rr);
        }

        // hover highlight
        if (hovered.type === 'node') {
            const rr = rect(hovered.gx, hovered.gy);
            p.noFill(); p.stroke('#fff'); p.strokeWeight(2 / cam.z);
            p.rect(rr.x, rr.y, rr.w, rr.h, 6 / cam.z);
        }

        // pluses + delete badges
        for (const n of nodes.values()) {
            const rr = rect(n.gx, n.gy);
            if (!intersect(rr, viewRect)) continue;

            // right plus: only if this node currently has NO children
            if (getChildrenKeys(key(n.gx, n.gy)).length === 0) {
                const pr = plusRightRect(rr);
                drawPlus(pr.x, pr.y, pr.s, isHover('plusR', n.gx, n.gy));
            }

            // bottom plus: if node has a parent, AND is bottom-most among its siblings
            const pk = parentOf.get(key(n.gx, n.gy));
            if (pk) {
                const sibs = getChildrenSorted(pk);
                const isBottom = sibs.length && sibs[sibs.length - 1].gx === n.gx && sibs[sibs.length - 1].gy === n.gy;
                if (isBottom) {
                    const pb = plusBottomRect(rr);
                    drawPlus(pb.x, pb.y, pb.s, isHover('plusB', n.gx, n.gy));
                }
            }

            // delete badge (on selected)
            if (n.selected) {
                const s = DELETE_BADGE_SIZE;
                const x = rr.x + rr.w - s - (6 / cam.z);
                const y = rr.y + (6 / cam.z);
                const isHoverDel = hovered.type === 'delete' && hovered.gx === n.gx && hovered.gy === n.gy;
                p.push();
                p.stroke(isHoverDel ? '#fff' : DELETE_BADGE_COLOR);
                p.strokeWeight(1.6 / cam.z);
                p.fill('rgba(0,0,0,0.25)');
                p.rect(x, y, s, s, 3 / cam.z);
                const cx = x + s/2, cy = y + s/2, arm = s*0.35;
                p.line(cx-arm, cy-arm, cx+arm, cy+arm);
                p.line(cx-arm, cy+arm, cx+arm, cy-arm);
                p.pop();
            }
        }

        p.pop();

        // central plus if empty
        if (nodes.size === 0) drawCentralPlus();

        updateCursor();
    };

    // events
    p.mouseMoved = () => {
        if (inputsLocked()) return;
        const w = screenToWorld(p.mouseX, p.mouseY);
        updateHover(w.x, w.y);
    };

    p.mouseWheel = (e) => {
        if (inputsLocked()) return;
        if (isLocked()) return false;
        const delta = -e.delta, zf = 1 + (delta>0 ? 0.1 : -0.1);
        const newZ = p.constrain(cam.z * zf, cam.minZ, cam.maxZ);
        const wx1 = (p.mouseX - cam.x)/cam.z, wy1 = (p.mouseY - cam.y)/cam.z;
        cam.z = newZ;
        const wx2 = (p.mouseX - cam.x)/cam.z, wy2 = (p.mouseY - cam.y)/cam.z;
        cam.x += (wx2 - wx1)*cam.z; cam.y += (wy2 - wy1)*cam.z;
        return false;
    };

    p.mousePressed = () => {
        if (inputsLocked()) return;
        if (isLocked()) {
            if (!(nodes.size === 0 && hovered.type === 'plus-center')) return;
        }
        // right press handled by pointer events (panning)
        if (p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) return;

        // seed first bubble
        if (nodes.size === 0 && hovered.type === 'plus-center') {
            spawnNode(0, 0, { label: '' }, null); // root has no parent
            return;
        }

        // right plus → create FIRST child of this node (if none)
        if (hovered.type === 'plusR') {
            const pk = key(hovered.gx, hovered.gy);
            const n = nodes.get(pk); if (!n) return;
            if (getChildrenKeys(pk).length > 0) return; // defensive
            const childGX = n.gx + 1;
            const childGY = n.gy; // align with parent row
            spawnNode(childGX, childGY, { label: '' }, pk);
            return;
        }

        // bottom plus → insert a NEW sibling row under this node (shift rows down)
        if (hovered.type === 'plusB') {
            const currentKey = key(hovered.gx, hovered.gy);
            const parentK = parentOf.get(currentKey);
            if (!parentK) return;

            const insertAtGy = hovered.gy + 1;

            // 1) create vertical space across the grid
            insertRow(insertAtGy);

            // 2) place the new sibling in the freshly inserted empty row, same column as other children
            const parentNode = nodes.get(parentK);
            if (!parentNode) return;
            const childGX = parentNode.gx + 1; // immediate column to the right of parent
            const childGY = insertAtGy;

            spawnNode(childGX, childGY, { label: '' }, parentK);
            return;
        }

        // delete → cascade delete this node and all its descendants
        if (hovered.type === 'delete') {
            cascadeDelete(key(hovered.gx, hovered.gy));
            return;
        }

        // node click → select
        if (hovered.type === 'node') {
            selectOnly(hovered.gx, hovered.gy);
            return;
        }

        // empty → clear
        clearSelection();
    };

    p.mouseReleased = () => { /* panning stopped by pointerup */ };

    // teardown
    const origRemove = p.remove;
    p.remove = function () {
        disposed = true;
        try { p.noLoop(); } catch (_) {}

        const c = p.canvas;
        if (c && p.__conv_ctx) {
            c.removeEventListener('contextmenu', p.__conv_ctx, { capture: true });
            p.__conv_ctx = null;
        }
        if (c && p.__pe) {
            c.removeEventListener('pointerdown', p.__pe.onDown);
            c.removeEventListener('pointermove', p.__pe.onMove);
            c.removeEventListener('pointerup', p.__pe.onUp);
            c.removeEventListener('pointercancel', p.__pe.onUp);
            p.__pe = null;
        }

        origRemove.call(p);
    };

    // ---------- helpers ----------
    function key(gx,gy){ return `${gx},${gy}`; }
    function centre(){ cam.x = p.width/2; cam.y = p.height/2; cam.z = 1; }
    function isLocked(){ return nodes.size === 0; }
    function screenToWorld(px,py){ return { x:(px-cam.x)/cam.z, y:(py-cam.y)/cam.z }; }
    function boundsWorld(){
        const tl = screenToWorld(0,0), br = screenToWorld(p.width,p.height);
        return { left:Math.min(tl.x,br.x), right:Math.max(tl.x,br.x), top:Math.min(tl.y,br.y), bottom:Math.max(tl.y,br.y) };
    }
    function rect(gx,gy){
        const cw = NODE_W + CELL_X_GAP, ch = NODE_H + CELL_Y_GAP;
        const x = gx*cw - NODE_W/2, y = gy*ch - NODE_H/2;
        return { x, y, w:NODE_W, h:NODE_H };
    }
    function intersect(a,b){ return !(a.x+a.w<b.x || b.x+b.w<a.x || a.y+a.h<b.y || b.y+b.h<a.y); }

    function drawGrid(){
        const cw = NODE_W + CELL_X_GAP, ch = NODE_H + CELL_Y_GAP;
        const v = boundsWorld();
        const startX = Math.floor(v.left/cw)*cw, endX = Math.ceil(v.right/cw)*cw;
        const startY = Math.floor(v.top/ch)*ch, endY = Math.ceil(v.bottom/ch)*ch;
        p.stroke(GRID); p.strokeWeight(1/cam.z);
        for (let x=startX; x<=endX; x+=cw) p.line(x, v.top, x, v.bottom);
        for (let y=startY; y<=endY; y+=ch) p.line(v.left, y, v.right, y);
    }

    function drawPlus(x,y,s,hover){
        p.push();
        p.stroke(hover ? PLUS_HOVER : PLUS_STROKE);
        p.strokeWeight(2 / cam.z);
        p.fill(PLUS_FILL);
        p.rect(x,y,s,s,3/cam.z);
        const cx=x+s/2, cy=y+s/2, arm=s*0.35;
        p.line(cx-arm, cy, cx+arm, cy);
        p.line(cx, cy-arm, cx, cy+arm);
        p.pop();
    }
    function plusRightRect(rr){ return { x: rr.x + rr.w + CELL_X_GAP/2 - PLUS_SIZE/2, y: rr.y + rr.h/2 - PLUS_SIZE/2, s: PLUS_SIZE }; }
    function plusBottomRect(rr){ return { x: rr.x + rr.w/2 - PLUS_SIZE/2, y: rr.y + rr.h + CELL_Y_GAP/2 - PLUS_SIZE/2, s: PLUS_SIZE }; }

    function drawLabel(n, rr){
        const text = n.meta?.label ?? '';
        if (!text) return;
        p.noStroke(); p.fill('#cfe7ff');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14 / cam.z);
        p.text(text, rr.x + rr.w/2, rr.y + rr.h/2);
    }

    function drawCentralPlus(){
        const s = PLUS_SIZE*2, x = p.width/2 - s/2, y = p.height/2 - s/2;
        const hover = (p.mouseX>=x && p.mouseX<=x+s && p.mouseY>=y && p.mouseY<=y+s);
        if (hover) hovered = { type:'plus-center' }; else if (hovered.type==='plus-center') hovered={type:null};
        p.stroke(hover?PLUS_HOVER:PLUS_STROKE); p.strokeWeight(2); p.fill(PLUS_FILL);
        p.rect(x,y,s,s,4);
        const cx=x+s/2, cy=y+s/2, arm=s*0.35;
        p.line(cx-arm,cy,cx+arm,cy); p.line(cx,cy-arm,cx,cy+arm);
    }

    function isHover(kind, gx, gy){
        return hovered.type === kind && hovered.gx === gx && hovered.gy === gy;
    }

    function updateHover(wx, wy){
        hovered = { type:null };

        // delete badge first
        for (const n of nodes.values()) {
            if (!n.selected) continue;
            const rr = rect(n.gx, n.gy);
            const s = DELETE_BADGE_SIZE;
            const x = rr.x + rr.w - s - (6 / cam.z), y = rr.y + (6 / cam.z);
            if (wx>=x && wx<=x+s && wy>=y && wy<=y+s) { hovered = { type:'delete', gx:n.gx, gy:n.gy }; return; }
        }

        // node body
        for (const n of nodes.values()) {
            const rr = rect(n.gx, n.gy);
            if (wx>=rr.x && wx<=rr.x+rr.w && wy>=rr.y && wy<=rr.y+rr.h) { hovered = { type:'node', gx:n.gx, gy:n.gy }; return; }
        }

        // pluses
        for (const n of nodes.values()) {
            const rr = rect(n.gx, n.gy);

            // RIGHT plus if zero children
            if (getChildrenKeys(key(n.gx, n.gy)).length === 0) {
                const pr = plusRightRect(rr);
                if (wx>=pr.x && wx<=pr.x+pr.s && wy>=pr.y && wy<=pr.y+pr.s) { hovered = { type:'plusR', gx:n.gx, gy:n.gy }; return; }
            }

            // BOTTOM plus only if has parent and is last among siblings
            const pk = parentOf.get(key(n.gx, n.gy));
            if (pk) {
                const sibs = getChildrenSorted(pk);
                const isBottom = sibs.length && sibs[sibs.length-1].gx===n.gx && sibs[sibs.length-1].gy===n.gy;
                if (isBottom) {
                    const pb = plusBottomRect(rr);
                    if (wx>=pb.x && wx<=pb.x+pb.s && wy>=pb.y && wy<=pb.y+pb.s) { hovered = { type:'plusB', gx:n.gx, gy:n.gy }; return; }
                }
            }
        }
    }

    function updateCursor() {
        if (inputsLocked()) { p.cursor('default'); return; }
        if (isLocked()) { p.cursor(hovered.type === 'plus-center' ? 'pointer' : 'default'); return; }
        if (isPanning)  { p.cursor('move'); return; }
        if (hovered.type === 'plusR' || hovered.type === 'plusB' || hovered.type === 'delete') { p.cursor('pointer'); return; }
        if (hovered.type === 'node') { p.cursor('crosshair'); return; }
        p.cursor('default');
    }

    function inputsLocked() {
        // Conversation sketch should only accept input when the overlay is active
        return typeof window !== 'undefined' && !window.__convActive;
    }

    // --- graph ops ---
    function spawnNode(gx, gy, meta, parentK /* may be null */){
        const k = key(gx, gy);
        if (nodes.has(k)) return;
        nodes.set(k, { gx, gy, selected:false, meta: meta ?? {} });
        if (parentK) linkParent(parentK, k);
        if (parentK) colourForParent(parentK);
        selectOnly(gx, gy);
        const B = window.ConversationEditorBridge;
        if (B?.notifyNodeAdded) B.notifyNodeAdded({ id:k, gx, gy, meta, parentId: parentK ?? null }, exportState());
    }

    function linkParent(parentK, childK){
        if (!children.has(parentK)) children.set(parentK, new Set());
        children.get(parentK).add(childK);
        parentOf.set(childK, parentK);
        colourForParent(parentK);
    }

    function unlinkParent(childK){
        const pk = parentOf.get(childK);
        if (pk) {
            parentOf.delete(childK);
            const set = children.get(pk);
            if (set) {
                set.delete(childK);
                if (set.size === 0) {
                    children.delete(pk);
                    parentColor.delete(pk); // no children → drop colour
                }
            }
        }
    }

    function getChildrenKeys(parentK){
        const set = children.get(parentK);
        return set ? [...set] : [];
    }
    function getChildrenSorted(parentK){
        const list = getChildrenKeys(parentK).map(k => nodes.get(k)).filter(Boolean);
        list.sort((a,b) => (a.gy - b.gy) || (a.gx - b.gx));
        return list;
    }

    function cascadeDelete(rootK){
        // DFS delete node and all descendants
        const stack = [rootK];
        const toDelete = new Set();
        while (stack.length) {
            const k = stack.pop();
            if (!k || toDelete.has(k)) continue;
            toDelete.add(k);
            const kids = getChildrenKeys(k);
            for (const ck of kids) stack.push(ck);
        }
        // unlink from parents and remove
        for (const delK of toDelete) {
            unlinkParent(delK);
            const n = nodes.get(delK);
            nodes.delete(delK);
            window.ConversationEditorBridge?.notifyNodeDeleted?.(delK, exportState());
        }
        clearSelection();
        window.ConversationEditorBridge?.notifyStateSnapshot?.(exportState());
    }

    function insertRow(insertAtGy) {
        // Build a remap table for all nodes at or below the insertion row
        const remap = new Map(); // oldKey -> newKey
        for (const n of nodes.values()) {
            if (n.gy >= insertAtGy) {
                const oldK = key(n.gx, n.gy);
                const newGy = n.gy + 1;
                remap.set(oldK, key(n.gx, newGy));
            }
        }
        if (remap.size === 0) return;

        // Rebuild nodes with shifted rows
        const newNodes = new Map();
        for (const [k, n] of nodes.entries()) {
            if (remap.has(k)) {
                const nk = remap.get(k);
                newNodes.set(nk, { ...n, gy: n.gy + 1 });
            } else {
                newNodes.set(k, n);
            }
        }

        // Remap parentOf (child -> parent)
        const newParentOf = new Map();
        for (const [childK, parentK] of parentOf.entries()) {
            const nk = remap.get(childK) || childK;
            const npk = remap.get(parentK) || parentK;
            newParentOf.set(nk, npk);
        }

        // Remap children (parent -> Set(children))
        const newChildren = new Map();
        for (const [pk, set] of children.entries()) {
            const npk = remap.get(pk) || pk;
            const newSet = new Set();
            for (const ck of set.values()) newSet.add(remap.get(ck) || ck);
            newChildren.set(npk, newSet);
        }

        // Commit
        nodes.clear(); for (const [k, v] of newNodes) nodes.set(k, v);
        parentOf.clear(); for (const [k, v] of newParentOf) parentOf.set(k, v);
        children.clear(); for (const [k, v] of newChildren) children.set(k, v);

        // Remap parent colours
        const newParentColor = new Map();
        for (const [pk, col] of parentColor.entries()) {
            const npk = remap.get(pk) || pk;
            newParentColor.set(npk, col);
        }
        parentColor.clear();
        for (const [k, v] of newParentColor) parentColor.set(k, v);

        // (Optional) notify snapshot so the host can reconcile ordering if needed
        window.ConversationEditorBridge?.notifyStateSnapshot?.(exportState());
    }

    function selectOnly(gx, gy){
        for (const n of nodes.values()) n.selected = false;
        const k = key(gx, gy); const n = nodes.get(k); if (n) n.selected = true;
        window.ConversationEditorBridge?.notifySelectionChange?.(k, exportState());
    }
    function clearSelection(){ for (const n of nodes.values()) n.selected=false; }

    function loadFromState(state) {
        // Clear current graph
        nodes.clear(); children.clear(); parentOf.clear();

        if (!state || !Array.isArray(state.nodes)) return;

        // Create nodes (no notifications)
        for (const nn of state.nodes) {
            const id = key(nn.gx, nn.gy);
            nodes.set(id, { gx: nn.gx, gy: nn.gy, selected: false, meta: nn.meta ?? {} });
        }

        // Link parents using explicit parentId if present; otherwise heuristic
        for (const nn of state.nodes) {
            const id = key(nn.gx, nn.gy);
            const pid = (nn.parentId ?? null);
            if (pid && nodes.has(pid)) {
                linkParent(pid, id);
            } else {
                const guess = key(nn.gx - 1, nn.gy);
                if (nodes.has(guess)) linkParent(guess, id);
            }
        }

        // Selection
        if (state.selected && nodes.has(state.selected)) {
            for (const n of nodes.values()) n.selected = false;
            const s = nodes.get(state.selected); if (s) s.selected = true;
        } else {
            for (const n of nodes.values()) n.selected = false;
        }

        // Bring colours up to date
        parentColor.clear();
        for (const [pk, set] of children.entries()) {
            if (set && set.size) colourForParent(pk);
        }
    }

    function exportState(){
        const out = [];
        for (const n of nodes.values()) {
            const id = key(n.gx, n.gy);
            const parentId = parentOf.get(id) ?? null;
            out.push({ id, gx:n.gx, gy:n.gy, parentId, meta:n.meta });
        }
        const selected = (() => { for (const n of nodes.values()) if (n.selected) return key(n.gx,n.gy); return null; })();
        return { nodes: out, selected };
    }
};