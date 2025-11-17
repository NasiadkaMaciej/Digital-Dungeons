// ------------------------
// RPG Editor – p5 Instance Mode
// ------------------------

// ----- Config -----
const ROOM_W = 160;
const ROOM_H = 100;
const CELL_GAP = 40; // spacing between rooms
const ROOM_FILL = '#1f1f1f';
const ROOM_STROKE = '#5cff7d';
const ROOM_STROKE_INACTIVE = '#4a4a4a';
const ROOM_STROKE_SELECTED = '#ffd74a';
const BG = '#151515';
const GRID_ACCENT = '#2a2a2a';
const PLUS_FILL = '#232323';
const PLUS_STROKE = '#9ee8a8';
const PLUS_HOVER = '#ffffff';
const PLUS_SIZE = 22;
const PLUS_EDGE_SIZE = 18;
const EDGE_THICKNESS = 2;
const DELETE_BADGE_SIZE = 16;
const DELETE_BADGE_COLOR = '#ff6b6b';

export const sketchFactory = (p) => {
    // ----- Camera -----
    let cam = {
        x: 0,   // world-to-screen translation X (in screen px)
        y: 0,   // world-to-screen translation Y (in screen px)
        z: 1.0, // zoom (scale)
        minZ: 0.25,
        maxZ: 3.0,
    };

    // ----- State -----
    /** Map key: "gx,gy" -> { gx, gy, selected:boolean, neighbors:{N:null|key,S:null|key,W:null|key,E:null|key} } */
    const rooms = new Map();
    /** Callback: null means no data yet => show central plus. */
    let dataFromCallback = null;

    // Interaction
    let isPanning = false;
    const panAnchor = { x: 0, y: 0 };
    const camAnchor = { x: 0, y: 0 };
    /** hovered.type: 'room' | 'plus-center' | 'plus-edge' | 'delete-room' | null */
    let hovered = { type: null, gx: 0, gy: 0, side: null };

    // Canvas-scoped contextmenu blocker (removed automatically when canvas is removed)
    let contextMenuHandler = null;

    // ----- p5 lifecycle -----
    p.setup = () => {
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.elt.id = 'mapCanvas';
        p.pixelDensity(window.devicePixelRatio || 1);
        centreCamera();

        // Pull initial data via bridge (guarded)
        const seed = (typeof window !== 'undefined' && window.RPGEditorBridge && window.RPGEditorBridge.pullInitialData)
            ? window.RPGEditorBridge.pullInitialData()
            : null;

        if (seed && seed.rooms && seed.rooms.length) {
            for (const r of seed.rooms) spawnRoom(r.gx, r.gy, r.meta); // uses local spawnRoom
            if (seed.selected) {
                const [sx, sy] = seed.selected.split(',').map(Number);
                selectOnly(sx, sy);
            }
            dataFromCallback = {}; // mark as "has data"
        }

        // Register state puller for Save functionality
        if (typeof window !== 'undefined' && window.RPGEditorBridge && window.RPGEditorBridge.setStatePuller) {
            window.RPGEditorBridge.setStatePuller(() => {
                const roomsList = [];
                for (const [key, room] of rooms.entries()) {
                    roomsList.push({
                        id: key,
                        gx: room.gx,
                        gy: room.gy,
                        meta: room.meta || {},
                    });
                }
                let selectedKey = null;
                for (const [key, room] of rooms.entries()) {
                    if (room.selected) {
                        selectedKey = key;
                        break;
                    }
                }
                return { rooms: roomsList, selected: selectedKey };
            });
        }

        const c = p.canvas || p._renderer?.elt;
        // Prevent context menu on right-drag panning (bind to canvas only)
        contextMenuHandler = (e) => e.preventDefault();
        if (c) {
            c.addEventListener('contextmenu', contextMenuHandler, { capture: true });

            // ---- Pointer Events: robust secondary/middle button panning ----
            const rectOf = () => c.getBoundingClientRect();

            const onPointerDown = (e) => {
                // buttons bitmask: 1=left, 2=right, 4=middle
                const rightOrMiddle = (e.button === 2 || e.button === 1) || (e.buttons & 0b110);
                if (!rightOrMiddle) return;

                // start panning
                isPanning = true;
                const rect = rectOf();
                panAnchor.x = e.clientX - rect.left;
                panAnchor.y = e.clientY - rect.top;
                camAnchor.x = cam.x;
                camAnchor.y = cam.y;

                // capture further moves even if pointer leaves canvas
                try { c.setPointerCapture(e.pointerId); } catch (_) {}
                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isPanning) return;
                const rect = rectOf();
                const curX = e.clientX - rect.left;
                const curY = e.clientY - rect.top;
                cam.x = camAnchor.x + (curX - panAnchor.x);
                cam.y = camAnchor.y + (curY - panAnchor.y);
                e.preventDefault();
            };

            const onPointerUp = (e) => {
                if (!isPanning) return;
                isPanning = false;
                try { c.releasePointerCapture(e.pointerId); } catch (_) {}
                e.preventDefault();
            };

            // store so we can detach on remove()
            p.__peHandlers = { onPointerDown, onPointerMove, onPointerUp };

            c.addEventListener('pointerdown', onPointerDown, { passive: false });
            c.addEventListener('pointermove', onPointerMove, { passive: false });
            c.addEventListener('pointerup', onPointerUp, { passive: false });
            c.addEventListener('pointercancel', onPointerUp, { passive: false });
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        if (rooms.size === 0) centreCamera();
    };

    p.draw = () => {
        if (isCameraLocked()) {
            centreCamera();
            isPanning = false;
        }

        p.background(BG);

        // Camera transform
        p.push();
        p.translate(cam.x, cam.y);
        p.scale(cam.z);

        // world-space draw
        drawGridHints();
        const view = currentWorldViewBounds();
        drawRoomsCulled(view);
        drawEdgePlusesCulled(view);

        p.pop();

        // UI overlay (screen space)
        drawCentralPlusIfNoData();

        // Cursor feedback
        updateCursor();
    };

    // ----- Camera helpers -----
    function centreCamera() {
        cam.x = p.width / 2;
        cam.y = p.height / 2;
        cam.z = 1.0;
    }

    function screenToWorld(px, py) {
        return { x: (px - cam.x) / cam.z, y: (py - cam.y) / cam.z };
    }

    function worldToScreen(wx, wy) {
        return { x: wx * cam.z + cam.x, y: wy * cam.z + cam.y };
    }

    function currentWorldViewBounds() {
        const tl = screenToWorld(0, 0);
        const br = screenToWorld(p.width, p.height);
        const left = Math.min(tl.x, br.x);
        const right = Math.max(tl.x, br.x);
        const top = Math.min(tl.y, br.y);
        const bottom = Math.max(tl.y, br.y);
        return { left, right, top, bottom };
    }

    // ----- Grid / geometry helpers -----
    function cellToWorld(gx, gy) {
        const cw = ROOM_W + CELL_GAP;
        const ch = ROOM_H + CELL_GAP;
        const x = gx * cw;
        const y = gy * ch;
        return { x: x - ROOM_W / 2, y: y - ROOM_H / 2 }; // top-left corner in world
    }

    function roomRect(gx, gy) {
        const tl = cellToWorld(gx, gy);
        return { x: tl.x, y: tl.y, w: ROOM_W, h: ROOM_H };
    }

    function rectsIntersect(a, b) {
        return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    }

    function roomKey(gx, gy) { return `${gx},${gy}`; }
    function hasRoom(gx, gy) { return rooms.has(roomKey(gx, gy)); }

    function neighbours(gx, gy) {
        return {
            N: { gx, gy: gy - 1 },
            S: { gx, gy: gy + 1 },
            W: { gx: gx - 1, gy },
            E: { gx: gx + 1, gy }
        };
    }

    // ----- Drawing -----
    function drawGridHints() {
        const cw = ROOM_W + CELL_GAP;
        const ch = ROOM_H + CELL_GAP;

        const view = currentWorldViewBounds();
        const left = view.left, right = view.right, top = view.top, bottom = view.bottom;

        const startX = Math.floor(left / cw) * cw;
        const endX   = Math.ceil(right / cw) * cw;
        const startY = Math.floor(top / ch) * ch;
        const endY   = Math.ceil(bottom / ch) * ch;

        p.stroke(GRID_ACCENT);
        p.strokeWeight(1 / cam.z);

        // Vertical lines
        for (let x = startX; x <= endX; x += cw) p.line(x, top, x, bottom);
        // Horizontal lines
        for (let y = startY; y <= endY; y += ch) p.line(left, y, right, y);
    }

    function drawRoomsCulled(view) {
        const viewRect = { x: view.left, y: view.top, w: view.right - view.left, h: view.bottom - view.top };
        for (const r of rooms.values()) {
            const rr = roomRect(r.gx, r.gy);
            if (!rectsIntersect(rr, viewRect)) continue;

            // Room body
            p.stroke(r.selected ? ROOM_STROKE_SELECTED : ROOM_STROKE);
            p.strokeWeight(EDGE_THICKNESS / cam.z);
            p.fill(ROOM_FILL);
            p.rect(rr.x, rr.y, rr.w, rr.h, 6 / cam.z);

            // Connectors and contents
            drawConnectors(r.gx, r.gy);
            drawRoomContents(r);
        }

        // Hover outline for room body
        if (hovered.type === 'room') {
            const rr = roomRect(hovered.gx, hovered.gy);
            p.noFill();
            p.stroke('#ffffff');
            p.strokeWeight(2 / cam.z);
            p.rect(rr.x, rr.y, rr.w, rr.h, 6 / cam.z);
        }

        // Delete badge on selected room
        for (const r of rooms.values()) {
            if (!r.selected) continue;
            const rr = roomRect(r.gx, r.gy);
            const s = DELETE_BADGE_SIZE;
            const x = rr.x + rr.w - s - (6 / cam.z);
            const y = rr.y + (6 / cam.z);

            const isHover = (hovered.type === 'delete-room' && hovered.gx === r.gx && hovered.gy === r.gy);
            p.push();
            p.stroke(isHover ? '#ffffff' : DELETE_BADGE_COLOR);
            p.strokeWeight(1.8 / cam.z);
            p.fill('rgba(0,0,0,0.25)');
            p.rect(x, y, s, s, 3 / cam.z);
            // "×"
            const cx = x + s / 2, cy = y + s / 2, arm = (s * 0.35);
            p.line(cx - arm, cy - arm, cx + arm, cy + arm);
            p.line(cx - arm, cy + arm, cx + arm, cy - arm);
            p.pop();
        }
    }

    function drawConnectors(gx, gy) {
        const rr = roomRect(gx, gy);
        const nb = neighbours(gx, gy);
        p.stroke(ROOM_STROKE_INACTIVE);
        p.strokeWeight(EDGE_THICKNESS / cam.z);

        if (hasRoom(nb.N.gx, nb.N.gy)) p.line(rr.x + rr.w / 2, rr.y, rr.x + rr.w / 2, rr.y - CELL_GAP / 2);
        if (hasRoom(nb.S.gx, nb.S.gy)) p.line(rr.x + rr.w / 2, rr.y + rr.h, rr.x + rr.w / 2, rr.y + rr.h + CELL_GAP / 2);
        if (hasRoom(nb.W.gx, nb.W.gy)) p.line(rr.x, rr.y + rr.h / 2, rr.x - CELL_GAP / 2, rr.y + rr.h / 2);
        if (hasRoom(nb.E.gx, nb.E.gy)) p.line(rr.x + rr.w, rr.y + rr.h / 2, rr.x + rr.w + CELL_GAP / 2, rr.y + rr.h / 2);
    }

    function drawEdgePlusesCulled(view) {
        const viewRect = { x: view.left, y: view.top, w: view.right - view.left, h: view.bottom - view.top };

        for (const r of rooms.values()) {
            const rr = roomRect(r.gx, r.gy);
            if (!rectsIntersect(rr, viewRect)) continue;

            const nb = neighbours(r.gx, r.gy);
            const pluses = [];

            if (!hasRoom(nb.N.gx, nb.N.gy)) pluses.push({ gx: r.gx, gy: r.gy, side: 'N', ...edgePlusRect(rr, 'N') });
            if (!hasRoom(nb.S.gx, nb.S.gy)) pluses.push({ gx: r.gx, gy: r.gy, side: 'S', ...edgePlusRect(rr, 'S') });
            if (!hasRoom(nb.W.gx, nb.W.gy)) pluses.push({ gx: r.gx, gy: r.gy, side: 'W', ...edgePlusRect(rr, 'W') });
            if (!hasRoom(nb.E.gx, nb.E.gy)) pluses.push({ gx: r.gx, gy: r.gy, side: 'E', ...edgePlusRect(rr, 'E') });

            for (const pz of pluses) {
                const isHover = (hovered.type === 'plus-edge' &&
                    hovered.gx === pz.gx && hovered.gy === pz.gy && hovered.side === pz.side);
                drawPlusRect(pz.x, pz.y, pz.s, isHover);
            }
        }
    }

    function edgePlusRect(rr, side) {
        const s = PLUS_EDGE_SIZE;
        const half = s / 2;
        switch (side) {
            case 'N': return { x: rr.x + rr.w / 2 - half, y: rr.y - CELL_GAP / 2 - half, s };
            case 'S': return { x: rr.x + rr.w / 2 - half, y: rr.y + rr.h + CELL_GAP / 2 - half, s };
            case 'W': return { x: rr.x - CELL_GAP / 2 - half, y: rr.y + rr.h / 2 - half, s };
            case 'E': return { x: rr.x + rr.w + CELL_GAP / 2 - half, y: rr.y + rr.h / 2 - half, s };
        }
    }

    function drawPlusRect(x, y, s, hover) {
        p.push();
        p.stroke(hover ? PLUS_HOVER : PLUS_STROKE);
        p.strokeWeight(2 / cam.z);
        p.fill(PLUS_FILL);
        p.rect(x, y, s, s, 3 / cam.z);
        const cx = x + s / 2;
        const cy = y + s / 2;
        const arm = (s * 0.35);
        p.line(cx - arm, cy, cx + arm, cy);
        p.line(cx, cy - arm, cx, cy + arm);
        p.pop();
    }

    function drawCentralPlusIfNoData() {
        if (rooms.size > 0) return;

        const s = PLUS_SIZE * 2;
        const x = p.width / 2 - s / 2;
        const y = p.height / 2 - s / 2;

        const mx = p.mouseX, my = p.mouseY;
        const hover = (mx >= x && mx <= x + s && my >= y && my <= y + s);
        if (hover) {
            hovered = { type: 'plus-center' };
        } else if (hovered.type === 'plus-center') {
            hovered = { type: null };
        }

        p.stroke(hover ? PLUS_HOVER : PLUS_STROKE);
        p.strokeWeight(2);
        p.fill(PLUS_FILL);
        p.rect(x, y, s, s, 4);

        const cx = x + s / 2, cy = y + s / 2, arm = s * 0.35;
        p.line(cx - arm, cy, cx + arm, cy);
        p.line(cx, cy - arm, cx, cy + arm);
    }

    // ----- Hit testing -----
    function updateHover(worldMx, worldMy) {
        hovered = { type: null };

        if (rooms.size === 0) return;

        // Delete badge first
        for (const r of rooms.values()) {
            if (!r.selected) continue;
            const rr = roomRect(r.gx, r.gy);
            const s = DELETE_BADGE_SIZE;
            const x = rr.x + rr.w - s - (6 / cam.z);
            const y = rr.y + (6 / cam.z);
            if (pointInRect(worldMx, worldMy, { x, y, w: s, h: s })) {
                hovered = { type: 'delete-room', gx: r.gx, gy: r.gy };
                return;
            }
        }

        // Room rects
        for (const r of rooms.values()) {
            const rr = roomRect(r.gx, r.gy);
            if (pointInRect(worldMx, worldMy, rr)) {
                hovered = { type: 'room', gx: r.gx, gy: r.gy };
                return;
            }
        }

        // Edge pluses
        for (const r of rooms.values()) {
            const rr = roomRect(r.gx, r.gy);
            const nb = neighbours(r.gx, r.gy);
            const check = (side, cond) => {
                if (!cond) return false;
                const pr = edgePlusRect(rr, side);
                if (pointInRect(worldMx, worldMy, { x: pr.x, y: pr.y, w: pr.s, h: pr.s })) {
                    hovered = { type: 'plus-edge', gx: r.gx, gy: r.gy, side };
                    return true;
                }
                return false;
            };
            if (check('N', !hasRoom(nb.N.gx, nb.N.gy))) return;
            if (check('S', !hasRoom(nb.S.gx, nb.S.gy))) return;
            if (check('W', !hasRoom(nb.W.gx, nb.W.gy))) return;
            if (check('E', !hasRoom(nb.E.gx, nb.E.gy))) return;
        }
    }

    function pointInRect(px, py, r) {
        return (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    }

    // ----- Mouse / wheel -----
    p.mouseMoved = () => {
        if (inputsLocked()) return;
        const w = screenToWorld(p.mouseX, p.mouseY);
        updateHover(w.x, w.y);
    };

    p.mouseDragged = () => {
        if (inputsLocked()) return;
        if (isCameraLocked()) return;

        // Continue panning on RIGHT/MIDDLE drag
        if (isPanning || p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) {
            if (!isPanning) {
                // If panning wasn’t started yet, initialise anchors
                isPanning = true;
                panAnchor.x = p.mouseX;
                panAnchor.y = p.mouseY;
                camAnchor.x = cam.x;
                camAnchor.y = cam.y;
            }
            cam.x = camAnchor.x + (p.mouseX - panAnchor.x);
            cam.y = camAnchor.y + (p.mouseY - panAnchor.y);
        }
    };

    p.mouseReleased = () => {
        isPanning = false;
    };

    p.mousePressed = () => {
        if (inputsLocked()) return;
        // If camera is locked, only allow central plus click-through
        if (isCameraLocked()) {
            const allowCentralPlus = (rooms.size === 0 && hovered.type === 'plus-center');
            if (!allowCentralPlus) return;
        }

        // Start panning immediately on RIGHT or MIDDLE
        if (p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) {
            console.log("panning");
            isPanning = true;
            panAnchor.x = p.mouseX;
            panAnchor.y = p.mouseY;
            camAnchor.x = cam.x;
            camAnchor.y = cam.y;
            return; // don’t treat as a click
        }

        // 1) Central plus -> first room
        if (rooms.size === 0 && hovered.type === 'plus-center') {
            spawnRoom(0, 0);
            dataFromCallback = {};
            return;
        }

        // 2) Edge plus -> spawn neighbour
        if (hovered.type === 'plus-edge') {
            const { gx, gy, side } = hovered;
            const nb = neighbours(gx, gy);
            const target = nb[side];
            spawnRoom(target.gx, target.gy);
            return;
        }

        // 3) Delete badge
        if (hovered.type === 'delete-room') {
            deleteRoom(hovered.gx, hovered.gy);
            return;
        }

        // 4) Room clicked -> select
        if (hovered.type === 'room') {
            selectOnly(hovered.gx, hovered.gy);
            return;
        }

        // 5) Empty space clears
        clearSelection();
    };

    p.mouseWheel = (e) => {
        if (inputsLocked()) return;
        if (isCameraLocked()) return false;

        const delta = -e.delta;
        const zoomFactor = 1 + (delta > 0 ? 0.1 : -0.1);
        const newZ = p.constrain(cam.z * zoomFactor, cam.minZ, cam.maxZ);

        const wx1 = (p.mouseX - cam.x) / cam.z;
        const wy1 = (p.mouseY - cam.y) / cam.z;
        cam.z = newZ;
        const wx2 = (p.mouseX - cam.x) / cam.z;
        const wy2 = (p.mouseY - cam.y) / cam.z;
        cam.x += (wx2 - wx1) * cam.z;
        cam.y += (wy2 - wy1) * cam.z;

        return false; // prevent page scroll
    };

    // ----- Rooms API -----
    function spawnRoom(gx, gy, meta) {
        const k = roomKey(gx, gy);
        if (!rooms.has(k)) {
            rooms.set(k, {
                gx, gy,
                selected: false,
                neighbors: { N: null, S: null, W: null, E: null },
                meta: meta // { hasChest?: boolean, entity?: {type:'monster'|'boss'|'person', id?:string}, conversationId?: string|null }
            });
        }

        reconcileNeighbors(gx, gy);
        const nb = neighbours(gx, gy);
        if (hasRoom(nb.N.gx, nb.N.gy)) reconcileNeighbors(nb.N.gx, nb.N.gy);
        if (hasRoom(nb.S.gx, nb.S.gy)) reconcileNeighbors(nb.S.gx, nb.S.gy);
        if (hasRoom(nb.W.gx, nb.W.gy)) reconcileNeighbors(nb.W.gx, nb.W.gy);
        if (hasRoom(nb.E.gx, nb.E.gy)) reconcileNeighbors(nb.E.gx, nb.E.gy);

        selectOnly(gx, gy);

        // Bridge notify (guarded)
        const Bridge = (typeof window !== 'undefined') ? window.RPGEditorBridge : undefined;
        if (Bridge && Bridge.notifyRoomAdded) {
            Bridge.notifyRoomAdded({ id: k, gx, gy }, exportState());
        }
    }

    function reconcileNeighbors(gx, gy) {
        const k = roomKey(gx, gy);
        const r = rooms.get(k);
        if (!r) return;

        const nb = neighbours(gx, gy);

        const setBoth = (side, nx, ny) => {
            const nk = roomKey(nx, ny);
            if (rooms.has(nk)) {
                r.neighbors[side] = nk;
                const opp = { N: 'S', S: 'N', W: 'E', E: 'W' }[side];
                const nr = rooms.get(nk);
                if (nr) nr.neighbors[opp] = k;
            }
        };

        r.neighbors = r.neighbors || { N: null, S: null, W: null, E: null };
        r.neighbors.N = r.neighbors.S = r.neighbors.W = r.neighbors.E = null;

        setBoth('N', nb.N.gx, nb.N.gy);
        setBoth('S', nb.S.gx, nb.S.gy);
        setBoth('W', nb.W.gx, nb.W.gy);
        setBoth('E', nb.E.gx, nb.E.gy);
    }

    function drawRoomContents(room) {
        if (!room.meta) return;

        // Proportional world-units (relative to ROOM_H)
        const ICON    = ROOM_H * 0.14;   // ~14% of room height
        const PAD     = ROOM_H * 0.15;   // padding near the edges
        const GAP     = ROOM_H * 0.06;   // spacing between icons
        const STROKE  = ROOM_H * 0.015;  // line thickness
        const RADIUS  = ROOM_H * 0.02;   // small corner radius
        const TAIL    = ROOM_H * 0.04;   // speech-bubble tail size

        const rr = roomRect(room.gx, room.gy);

        let ix = rr.x + PAD;
        const iy = rr.y + rr.h - PAD - ICON;

        // Chest
        if (room.meta.hasChest) {
            p.push();
            p.noFill();
            p.stroke('#ffd791');
            p.strokeWeight(STROKE);
            p.rect(ix, iy, ICON, ICON, RADIUS);
            p.line(ix, iy + ICON * 0.45, ix + ICON, iy + ICON * 0.45);
            p.pop();
            ix += ICON + GAP;
        }

        // Entity (M/B/P)
        if (room.meta.entity && room.meta.entity.type) {
            const t = room.meta.entity.type;
            const letter = t === 'monster' ? 'M' : (t === 'boss' ? 'B' : 'P');

            const cx = ix + ICON / 2;
            const cy = iy + ICON / 2;

            p.push();
            p.noFill();
            p.stroke('#9ad1ff');
            p.strokeWeight(STROKE);
            p.ellipse(cx, cy, ICON, ICON);

            p.noStroke();
            p.fill('#9ad1ff');
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(ICON * 0.7);  // scale text with the icon
            p.text(letter, cx, cy);
            p.pop();

            ix += ICON + GAP;
        }

        // Conversation bubble
        if ('conversationId' in (room.meta || {})) {
            p.push();
            p.noFill();
            p.stroke('#c8a1ff');
            p.strokeWeight(STROKE);

            const w = ICON;
            const h = ICON * 0.75;
            const rx = ix;
            const ry = iy + (ICON - h);

            p.rect(rx, ry, w, h, RADIUS);

            const tx = rx + w * 0.25;
            const ty = ry + h;
            p.triangle(
                tx, ty,
                tx + TAIL, ty + TAIL,
                tx + TAIL * 2, ty
            );

            p.pop();
            // ix += ICON + GAP; // keep if you’ll ever draw more icons after this
        }
    }

    // Delete a room
    function deleteRoom(gx, gy) {
        const k = roomKey(gx, gy);
        const victim = rooms.get(k);
        if (!victim) return;

        const nb = neighbours(gx, gy);
        const neighList = [nb.N, nb.S, nb.W, nb.E];

        rooms.delete(k);

        for (const n of neighList) {
            if (hasRoom(n.gx, n.gy)) reconcileNeighbors(n.gx, n.gy);
        }

        clearSelection();

        if (rooms.size === 0) dataFromCallback = null;

        const Bridge = (typeof window !== 'undefined') ? window.RPGEditorBridge : undefined;
        if (Bridge) {
            const state = exportState();
            if (Bridge.notifyRoomDeleted) Bridge.notifyRoomDeleted(k, state);
            if (Bridge.notifyStateSnapshot) Bridge.notifyStateSnapshot(state);
        }
    }

    function selectOnly(gx, gy) {
        for (const r of rooms.values()) r.selected = false;
        const k = roomKey(gx, gy);
        const r = rooms.get(k);
        if (r) r.selected = true;

        const Bridge = (typeof window !== 'undefined') ? window.RPGEditorBridge : undefined;
        if (Bridge && Bridge.notifySelectionChange) {
            Bridge.notifySelectionChange(k, exportState());
        }
    }

    function clearSelection() {
        for (const r of rooms.values()) r.selected = false;
    }

    // ----- Cursor -----
    function updateCursor() {
        if (isCameraLocked()) {
            if (hovered.type === 'plus-center') { p.cursor('pointer'); }
            else { p.cursor('default'); }
            return;
        }

        if (isPanning) { p.cursor('move'); return; }
        if (hovered.type === 'plus-center' || hovered.type === 'plus-edge') { p.cursor('pointer'); return; }
        if (hovered.type === 'room') { p.cursor('crosshair'); return; }
        if (hovered.type === 'delete-room') { p.cursor('pointer'); return; }
        p.cursor('default');
    }

    // Lock camera until there is at least one room (or preloaded data populated rooms)
    function isCameraLocked() { return rooms.size === 0; }

    function inputsLocked() {
        return typeof window !== 'undefined' && !!window.__convActive;
    }

    // EXPORT STATE
    function exportState() {
        const out = [];
        for (const r of rooms.values()) {
            out.push({ id: roomKey(r.gx, r.gy), gx: r.gx, gy: r.gy, meta: r.meta });
        }
        const selected = (() => {
            for (const r of rooms.values()) if (r.selected) return roomKey(r.gx, r.gy);
            return null;
        })();
        return { rooms: out, selected };
    }

    // Cleanup (React unmount / manual remove)
    const origRemove = p.remove;
    p.remove = function () {
        // detach canvas-scoped context menu handler
        const c = p.canvas || p._renderer?.elt;
        if (c && contextMenuHandler) {
            c.removeEventListener('contextmenu', contextMenuHandler);
            contextMenuHandler = null;
        }
        if (c && p.__peHandlers) {
            const { onPointerDown, onPointerMove, onPointerUp } = p.__peHandlers;
            c.removeEventListener('pointerdown', onPointerDown);
            c.removeEventListener('pointermove', onPointerMove);
            c.removeEventListener('pointerup', onPointerUp);
            c.removeEventListener('pointercancel', onPointerUp);
            p.__peHandlers = null;
        }
        origRemove.call(p);
    };
};