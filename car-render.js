˜// Global State for Visuals
window.vehicleData = {};
window.activePartKey = null;
window.activePartElement = null;
window.activeKasa = 'Sedan';
window.isSchemaEditMode = false;
window.selectedPartKey = null;
window.selectedPartPath = null;

const MOVE_STEP = 5;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialPartX = 0;
let initialPartY = 0;

// Mouse Move Listener for Dragging
document.addEventListener('mousemove', (e) => {
    if (!window.isSchemaEditMode || !isDragging || !window.selectedPartKey) return;

    e.preventDefault();
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    // Convert screen moves to SVG coordinate moves
    // The SVG groups (grp-left, grp-right) are scaled with (-0.6, 0.6) or similar.
    // This flips the X-axis, so +ScreenX equals -LocalX.
    // To move the part Visually Right, we must DECREASE the Local X coordinate.

    let t = getTransform(window.selectedPartKey);
    t.x = initialPartX - dx; // INVERTED logic due to mirrored group
    t.y = initialPartY + dy;

    updateAndSave(t);
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        // Final save could be here if we want to reduce server calls, 
        // but updateAndSave already calls it. 
        // We might want to debounce server saves in updateAndSave?
    }
});

// --- VISUALS LOADER ---
// --- VISUALS LOADER ---
function loadVisuals(type) {
    let schemaType = type;
    if (type === 'Ticari') schemaType = 'Panelvan'; // Map Ticari to Panelvan
    if (!carSchemas[schemaType]) schemaType = 'Sedan'; // Fallback

    window.activeKasa = schemaType;

    const schema = carSchemas[schemaType];
    const svg = document.getElementById('mainSvg') || document.getElementById('carSvg'); // Support both IDs
    if (!svg) return;

    svg.innerHTML = '';

    const isMobile = window.innerWidth < 768; // Mobile Breakpoint

    // Dynamic Layout
    let tLeft, tTop, tRight;

    if (isMobile) {
        // Vertical Stack for Mobile
        // Adjust ViewBox for vertical layout
        svg.setAttribute("viewBox", "0 0 500 950");

        // X=20 margin
        tLeft = "translate(20, 50) scale(0.55, 0.55)";
        // Y shift +300
        tTop = "translate(20, 350) scale(0.55, 0.55)";
        // Y shift +600. Flipped X.
        // Width ~275. Origin at 20 + 275 = 295.
        tRight = "translate(295, 650) scale(-0.55, 0.55)";

        // LABELS
        addText(svg, 100, 40, "SOL YAN");
        addText(svg, 100, 340, "TAVAN / KAPUT");
        addText(svg, 100, 640, "SAÄ YAN");
    } else {
        // Desktop Horizontal
        svg.setAttribute("viewBox", "0 0 1200 600");

        tLeft = "translate(20, 50) scale(0.55, 0.55)";
        tTop = "translate(320, 50) scale(0.55, 0.55)";
        tRight = "translate(895, 50) scale(-0.55, 0.55)";

        // LABELS
        addText(svg, 100, 40, "SOL YAN");
        addText(svg, 460, 40, "TAVAN / KAPUT");
        addText(svg, 760, 40, "SAÄ YAN");
    }

    const gLeft = createGroup(svg, "grp-left", tLeft);
    const gTop = createGroup(svg, "grp-top", tTop);
    const gRight = createGroup(svg, "grp-right", tRight);

    // Helper to create and configure a path element
    function createAndConfigurePart(d, key, group) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "white");
        path.setAttribute("stroke", "#333");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("class", "car-part");
        path.setAttribute("id", key);

        if (window.isSchemaEditMode) {
            path.style.cursor = "move";
            path.onclick = (e) => {
                e.stopPropagation();
                selectPartForEdit(key, path);
            };
            path.onmouseover = () => { if (path !== window.selectedPartPath) path.style.stroke = "red"; };
            path.onmouseout = () => { if (path !== window.selectedPartPath) path.style.stroke = "none"; };
            path.ondblclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectPartForEdit(key, path);
                rotatePart(-90);
            };
            path.onmousedown = (e) => {
                if (e.button !== 0) return; // Only left click
                e.stopPropagation();
                selectPartForEdit(key, path);

                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;

                let t = getTransform(key);
                initialPartX = t.x || 0;
                initialPartY = t.y || 0;
            };
            path.onwheel = (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectPartForEdit(key, path);

                // Wheel Down (positive) -> Scale Down
                // Wheel Up (negative) -> Scale Up
                const scaleFactor = e.deltaY > 0 ? -0.05 : 0.05;
                scalePart(scaleFactor * 10, scaleFactor * 10); // scalePart expects factor * 0.1
            };
        } else {
            if (window.vehicleData[key]) updatePathColor(path, window.vehicleData[key]);

            // Interaction Logic for Normal Mode
            attachNormalEvents(path, key, group);
        }

        // Apply Saved Transform
        const savedTransform = schema[key + "_transform"];

        // Special styling
        if (key.includes('cam')) {
            path.setAttribute("fill", "#e0f2fe");
            path.setAttribute("stroke", "#94a3b8");
        } else if (key.includes('far')) {
            path.setAttribute("fill", "#fef08a");
            path.setAttribute("fill-opacity", "0.5");
        }

        group.appendChild(path);

        if (savedTransform) {
            setTimeout(() => {
                updatePartTransform(path, savedTransform);
            }, 0);
        }

        // Professional Look Filters
        setTimeout(() => {
            // if (!window.isSchemaEditMode) {
            path.style.filter = "drop-shadow(2px 2px 2px rgba(0,0,0,0.3))";
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            // }
        }, 0);
    }

    // --- MAIN RENDER LOOP ---
    Object.keys(schema).forEach(key => {
        if (key.includes('_transform')) return; // Skip metadata

        const d = schema[key];
        // Determine Group
        let targetGroup = gTop; // Default to Middle/Top (e.g. Kaput, Tavan, Tampon)

        if (key.startsWith('sol_')) targetGroup = gLeft;
        else if (key.startsWith('sag_')) targetGroup = gRight;

        createAndConfigurePart(d, key, targetGroup);
    });
}

function attachNormalEvents(path, key, parent) {
    let pressTimer = null;
    let isLongPress = false;

    const startPress = (e) => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            togglePart(key, path, e);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const endPress = (e) => {
        if (pressTimer) clearTimeout(pressTimer);
        if (!isLongPress) {
            e.preventDefault();
            cycleStatus(key, path);
        }
    };

    const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };

    path.onmousedown = (e) => { if (e.button === 0) startPress(e); };
    path.onmouseup = (e) => { if (e.button === 0) endPress(e); };
    path.onmouseleave = cancelPress;
    path.ontouchstart = (e) => startPress(e.touches[0]);
    path.ontouchend = (e) => { e.preventDefault(); endPress(e); };
    path.ontouchcancel = cancelPress;
    path.oncontextmenu = (e) => {
        e.preventDefault();
        closeMenu();
        togglePart(key, path, e);
    };
}

function cycleStatus(key, path) {
    const cycles = ['Orjinal', 'BoyalÄ±', 'DeÄŸiÅŸen', 'Lokal BoyalÄ±'];
    let curr = window.vehicleData[key] || 'Orjinal';
    let idx = cycles.indexOf(curr);
    if (idx === -1) idx = -1;
    let next = cycles[(idx + 1) % cycles.length];
    applyStatusWrapper(key, path, next);
    closeMenu();
}

function togglePart(key, path, event) {
    event.stopPropagation();
    e = event || window.event;
    window.activePartKey = key;
    window.activePartElement = path;
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
}

function applyStatus(status) {
    if (!window.activePartKey || !window.activePartElement) return;
    applyStatusWrapper(window.activePartKey, window.activePartElement, status);
    closeMenu();
}

function applyStatusWrapper(key, path, status) {
    window.vehicleData[key] = status;
    updatePathColor(path, status);
    if (typeof window.isDirty !== 'undefined') window.isDirty = true;

    // Auto-save logic if needed, or rely on global save
    // console.log(`Updated ${key} to ${status}`);
}

function updatePathColor(path, status) {
    // Standardized Status Colors (As requested)
    const colors = {
        'ORIJINAL': 'white',             // Original
        'BOYALI': '#f59e0b',             // Painted (Orange/Yellow)
        'DEGISEN': '#ef4444',            // Changed (Red)
        'LOKAL': '#3b82f6',              // Local Paint (Blue)
        'EZIK_CIZIK': '#8b5cf6',         // Dent/Scratch (Purple)
        'SÃ¶k Tak': '#8b5cf6',            // Legacy mapping
        'Plastik': '#cbd5e1',            // Legacy

        // Legacy fallback support
        'Orjinal': 'white',
        'BoyalÄ±': '#f59e0b',
        'DeÄŸiÅŸen': '#ef4444',
        'Lokal BoyalÄ±': '#3b82f6'
    };

    path.style.fill = colors[status] || 'white';

    // Visual Texture for 'EZIK_CIZIK' or special types could be added here
    // e.g. path.style.strokeDasharray = ...
}

function createGroup(svg, id, transform) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("transform", transform);
    svg.appendChild(g);
    return g;
}

function addText(parent, x, y, content) {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("fill", "#333");
    t.setAttribute("font-weight", "bold");
    t.textContent = content;
    parent.appendChild(t);
}

// --- DRAWING INTEGRATION ---
let carCanvas = null;

function initDrawing() {
    if (carCanvas) return;
    const container = document.querySelector('.visuals-container');
    if (container) {
        // Ensure container has ID
        if (!container.id) container.id = 'visuals-container-' + Date.now();
        carCanvas = new CarCanvas(container.id);

        // Try to load existing drawing if any
        if (window.vehicleData && window.vehicleData.drawingData) {
            carCanvas.loadFromDataURL(window.vehicleData.drawingData);
        }
    }
}

// Hook into loadVisuals or just call it safely
const originalLoadVisuals = loadVisuals;
loadVisuals = function (type) {
    originalLoadVisuals(type);
    setTimeout(initDrawing, 100); // Wait for DOM
};


// --- EDITOR LOGIC ---
function toggleSchemaEditMode() {
    window.isSchemaEditMode = !window.isSchemaEditMode;
    const btn = document.getElementById('btnToggleEdit');
    let panel = document.getElementById('editorPanel');

    if (window.isSchemaEditMode) {
        btn.className = 'btn btn-primary btn-sm';
        btn.innerHTML = '<i class="fas fa-check"></i> DÃ¼zenleme AÃ§Ä±k';
        if (!panel) createEditorPanel(); // Helper to create HTML
        else panel.style.display = 'block';
        showToast("MOD: Ã‡ift TÄ±kla=DÃ¶ndÃ¼r | YÃ¶n=TaÅŸÄ± | Boyut=Åekil Ver");
    } else {
        btn.className = 'btn btn-outline btn-sm';
        btn.innerHTML = '<i class="fas fa-tools"></i> YÃ¶netici DÃ¼zenleme';
        if (panel) panel.style.display = 'none';

        // Turn off drawing too when closing admin panel? 
        // Or specific toggle? Let's keep drawing separate or inside panel.
        // If getting out of edit mode, disable drawing pointer events for safety
        if (carCanvas) carCanvas.enableDrawing(false);

        window.selectedPartKey = null;
        if (window.selectedPartPath) {
            window.selectedPartPath.style.stroke = "#333";
            window.selectedPartPath.style.strokeWidth = "2px";
        }
        window.selectedPartPath = null;
    }
    loadVisuals(window.activeKasa); // Reload to attach correct event handlers
}

function createEditorPanel() {
    const panel = document.createElement('div');
    panel.id = 'editorPanel';
    // Initial Style
    panel.style.cssText = `
        position: fixed; bottom: 80px; right: 20px; 
        background: rgba(255, 255, 255, 0.95); 
        backdrop-filter: blur(5px);
        padding: 0; border-radius: 8px; 
        box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 1000;
        border: 1px solid rgba(0,0,0,0.1); width: 280px; font-family: 'Roboto', sans-serif;
        overflow: hidden; transition: box-shadow 0.3s;
    `;

    // Header for Dragging
    const headerHtml = `
        <div id="editorHeader" class="editor-header" style="
            background: #f1f5f9; padding: 10px 15px; cursor: move; border-bottom: 1px solid #e2e8f0;
            font-weight: bold; color: #475569; display: flex; justify-content: space-between; align-items: center;
        ">
            <span><i class="fas fa-layer-group"></i> Pratik EditÃ¶r</span>
            <div>
                 <button onclick="minimizeEditor()" class="btn-tool-mini"><i class="fas fa-minus"></i></button>
            </div>
        </div>
    `;

    const contentHtml = `
        <div id="editorContent" style="padding: 15px;">
            <!-- TABS -->
            <div style="display:flex; border-bottom:1px solid #ddd; margin-bottom:10px;">
                <button class="tab-btn active" onclick="switchTab(this, 'tab-parts')">ParÃ§alar</button>
                <button class="tab-btn" onclick="switchTab(this, 'tab-draw')">Ã‡izim</button>
            </div>

            <div id="tab-parts">
                <div id="editorStatus" style="font-size:0.85rem; color:#64748b; margin-bottom:15px; font-style:italic; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">
                    ParÃ§a seÃ§ilmedi.
                </div>
                <!-- CONTROLS GRID -->
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom:15px;">
                    <button class="btn-tool" onclick="rotatePart(-45)" title="Sola DÃ¶ndÃ¼r"><i class="fas fa-undo"></i></button>
                    <button class="btn-tool" onclick="movePart(0, -1)" title="YukarÄ±"><i class="fas fa-arrow-up"></i></button>
                    <button class="btn-tool" onclick="rotatePart(45)" title="SaÄŸa DÃ¶ndÃ¼r"><i class="fas fa-redo"></i></button>
                    <button class="btn-tool" onclick="resetPart()" title="SÄ±fÄ±rla" style="color:var(--danger);"><i class="fas fa-trash-restore"></i></button>

                    <button class="btn-tool" onclick="movePart(1, 0)" title="Sola"><i class="fas fa-arrow-left"></i></button>
                    <button class="btn-tool" onclick="movePart(0, 1)" title="AÅŸaÄŸÄ±"><i class="fas fa-arrow-down"></i></button>
                    <button class="btn-tool" onclick="movePart(-1, 0)" title="SaÄŸa"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-tool" onclick="toggleVisibility()" title="Gizle/GÃ¶ster"><i class="fas fa-eye"></i></button>
                </div>
                <!-- LAYERS -->
                <div style="display:flex; gap:5px; margin-bottom:10px;">
                     <button class="btn-tool flex-1" onclick="changeLayer('up')"><i class="fas fa-level-up-alt"></i> Ã–ne</button>
                     <button class="btn-tool flex-1" onclick="changeLayer('down')"><i class="fas fa-level-down-alt"></i> Arkaya</button>
                </div>
                 <!-- SCALING -->
                <div style="display:flex; gap:5px; margin-bottom:15px;">
                    <button class="btn-tool flex-1" onclick="scalePart(1, 1)"><i class="fas fa-expand"></i> BÃ¼yÃ¼t</button>
                    <button class="btn-tool flex-1" onclick="scalePart(-1, -1)"><i class="fas fa-compress"></i> KÃ¼Ã§Ã¼lt</button>
                </div>
            </div>

            <div id="tab-draw" style="display:none;">
                <div style="display:flex; gap:5px; margin-bottom:10px; flex-wrap:wrap;">
                    <button class="btn-tool" onclick="setDrawMode(true)" id="btnDrawOn" style="flex:2;"><i class="fas fa-pen"></i> Ã‡izim AÃ§</button>
                    <button class="btn-tool" onclick="setDrawMode(false)" id="btnDrawOff" style="flex:1;"><i class="fas fa-mouse-pointer"></i></button>
                </div>
                <div class="paint-tools">
                    <div class="paint-btn active" onclick="setDrawColor('#ef4444', this)" style="background:#ef4444;"></div>
                    <div class="paint-btn" onclick="setDrawColor('#3b82f6', this)" style="background:#3b82f6;"></div>
                    <div class="paint-btn" onclick="setDrawColor('#22c55e', this)" style="background:#22c55e;"></div>
                    <div class="paint-btn" onclick="setDrawColor('#000000', this)" style="background:#000000;"></div>
                    <div class="paint-btn" onclick="setDrawEraser(this)"><i class="fas fa-eraser"></i></div>
                </div>
                <div style="margin-top:10px; display:flex; gap:5px;">
                    <button class="btn-tool flex-1" onclick="carCanvas.undo()"><i class="fas fa-undo"></i> Geri</button>
                    <button class="btn-tool flex-1" onclick="carCanvas.clear()"><i class="fas fa-trash"></i> Temizle</button>
                </div>
            </div>

            <!-- ACTIONS -->
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button class="btn btn-sm btn-success" onclick="saveSchemasToServer()" style="flex:1;"><i class="fas fa-save"></i> Kaydet</button>
                <button class="btn btn-sm btn-white" onclick="toggleSchemaEditMode()" style="flex:1;"><i class="fas fa-times"></i> Kapat</button>
            </div>
        </div>
        <style>
            .btn-tool {
                background: white; border: 1px solid #e2e8f0; border-radius: 6px;
                padding: 6px; cursor: pointer; color: #475569; transition: all 0.2s;
                display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
            }
            .btn-tool:hover { background: #f8fafc; border-color: #cbd5e1; }
            .btn-tool.active { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
            .flex-1 { flex: 1; }
            .btn-white { background: white; border: 1px solid #e2e8f0; }
            
            .tab-btn {
                flex: 1; padding: 8px; border: none; background: transparent;
                border-bottom: 2px solid transparent; cursor: pointer; font-weight: 500; color: #64748b;
            }
            .tab-btn.active {
                color: #2563eb; border-bottom-color: #2563eb;
            }
            .btn-tool-mini {
                background: transparent; border: none; cursor: pointer; color: #64748b; padding: 2px 5px;
            }
        </style>
    `;

    panel.innerHTML = headerHtml + contentHtml;
    document.body.appendChild(panel);
    makeElementDraggable(panel);
    initDrawing(); // Init canvas when panel is created
}

// Draw Tab Logic
window.switchTab = function (btn, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-parts').style.display = 'none';
    document.getElementById('tab-draw').style.display = 'none';
    document.getElementById(tabId).style.display = 'block';
};

window.setDrawMode = function (enable) {
    if (!carCanvas) initDrawing();
    carCanvas.enableDrawing(enable);
    document.getElementById('btnDrawOn').classList.toggle('active', enable);
    document.getElementById('btnDrawOff').classList.toggle('active', !enable);
};

window.setDrawColor = function (color, btn) {
    if (!carCanvas) return;
    carCanvas.setColor(color);
    document.querySelectorAll('.paint-btn').forEach(b => b.classList.remove('ring'));
    btn.classList.add('ring'); // Add visual indicator
};

window.setDrawEraser = function (btn) {
    if (!carCanvas) return;
    carCanvas.setMode('eraser');
    document.querySelectorAll('.paint-btn').forEach(b => b.classList.remove('ring'));
    btn.classList.add('ring');
};

window.minimizeEditor = function () {
    const panel = document.getElementById('editorPanel');
    panel.classList.toggle('minimized');
    const content = document.getElementById('editorContent');
    if (panel.classList.contains('minimized')) {
        content.style.display = 'none';
        panel.style.height = 'auto';
        panel.style.width = '200px';
    } else {
        content.style.display = 'block';
        panel.style.width = '280px';
    }
};

// Override Save to include drawing
// Override Save to include drawing
let originalSaveSchemas = null;
if (typeof saveSchemasToServer !== 'undefined') {
    originalSaveSchemas = saveSchemasToServer;
} else {
    // Define dummy if missing to prevent crash
    window.saveSchemasToServer = async function () { console.log("Schema save (mock)"); };
    originalSaveSchemas = window.saveSchemasToServer;
}

saveSchemasToServer = async function () {
    // 1. Save Schemas (Positions)
    if (originalSaveSchemas) await originalSaveSchemas();

    // 2. Save Drawing Data (Usually belongs to specific REPORT/VEHICLE, not global schema)
    // But since the user asked for drawing *in the editor context*, maybe they mean
    // marking specific damage for THAT report?
    // "Pratik EditÃ¶rde engel oluyor" implies using it for the report.
    // So we should save it to window.vehicleData and trigger report save if possible.

    if (carCanvas) {
        const dataUrl = carCanvas.getDataURL();
        if (window.vehicleData) {
            window.vehicleData.drawingData = dataUrl;
            showToast("Ã‡izim verisi araca eklendi (Raporu Kaydet deyiniz).");
            // If in report wizard, we might auto-save the report?
        }
    }
};

// ... existing code ...

async function loadSchemasFromServer() {
    try {
        const res = await fetch('/api/schemas');
        const json = await res.json();
        if (json && Object.keys(json).length > 0) {
            Object.assign(carSchemas, json);
            loadVisuals(window.activeKasa);
        }
    } catch (e) { console.error("Schema load error", e); }
}

// --- MOBILE DRAG & DROP LOGIC ---
function initMobileDragDrop() {
    const items = document.querySelectorAll('.palette-item');
    let ghost = null;
    let currentStatus = null;
    let currentBadge = null;
    let currentColor = null;
    let currentBorder = null;

    items.forEach(item => {
        // TOUCH START
        item.addEventListener('touchstart', (e) => {
            // e.preventDefault(); // Might block scrolling if not careful, but needed for visual sync
            // Only prevent default if we intend to drag.

            const touch = e.touches[0];
            currentStatus = item.dataset.status;
            currentColor = item.style.backgroundColor;
            currentBorder = item.style.borderColor;
            currentBadge = item.querySelector('span') ? item.querySelector('span').innerText : '';
            if (currentStatus === 'Orjinal') currentBadge = '<i class="fas fa-eraser"></i>';

            // Create Ghost
            ghost = document.createElement('div');
            ghost.className = 'drag-ghost';
            ghost.style.background = currentColor;
            ghost.style.border = currentBorder;
            ghost.innerHTML = currentBadge;
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
            document.body.appendChild(ghost);
        }, { passive: false }); // passive: false to allow preventDefault if needed

        // TOUCH MOVE
        item.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Stop scrolling while dragging paint
            if (!ghost) return;
            const touch = e.touches[0];
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';

            // Highlight potential target?
            ghost.style.visibility = 'hidden'; // Hide ghost briefly to check element below
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            ghost.style.visibility = 'visible';

            if (el && el.classList.contains('car-part')) {
                ghost.style.transform = "translate(-50%, -50%) scale(1.2)"; // Pulse effect
            } else {
                ghost.style.transform = "translate(-50%, -50%) scale(1.0)";
            }
        }, { passive: false });

        // TOUCH END
        item.addEventListener('touchend', (e) => {
            if (!ghost) return;

            // Get final position
            const touch = e.changedTouches[0];

            // Hide ghost to find element underneath
            ghost.style.display = 'none';
            const el = document.elementFromPoint(touch.clientX, touch.clientY);

            if (el && el.classList.contains('car-part')) {
                // Success Drop!
                const partKey = el.id;
                applyStatusToPart(partKey, currentStatus);

                // Visual Feedback
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.left = touch.clientX + 'px';
                ripple.style.top = touch.clientY + 'px';
                ripple.style.width = '10px'; ripple.style.height = '10px';
                ripple.style.background = 'rgba(255,255,255,0.8)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.transition = 'all 0.4s';
                document.body.appendChild(ripple);
                setTimeout(() => {
                    ripple.style.width = '100px';
                    ripple.style.height = '100px';
                    ripple.style.opacity = '0';
                }, 10);
                setTimeout(() => ripple.remove(), 400);
            }

            ghost.remove();
            ghost = null;
            currentStatus = null;
        });
    });
}

function applyStatusToPart(key, status) {
    // 1. Update Data
    window.vehicleData[key] = status;
    if (typeof window.isDirty !== 'undefined') window.isDirty = true;

    // 2. Update Visuals
    const path = document.getElementById(key);
    if (path) updatePathColor(path, status);

    // 3. Trigger Valuation Recalc if exists
    if (typeof calculateEstimatedValue === 'function') calculateEstimatedValue();

    // 4. Save to server? (Debounced usually, but user likes instant)
    // We rely on 'saveReport' generally, but local update is enough for UI.
}

function updatePartTransform(path, transform) {
    if (!path || !transform) return;

    let transformStr = transform;
    if (typeof transform === 'object') {
        // Convert object to string
        // Expected format: { x, y, rotation, scaleX, scaleY }
        const x = transform.x || 0;
        const y = transform.y || 0;
        const r = transform.rotation || 0;
        const sx = transform.scaleX || 1;
        const sy = transform.scaleY || 1;
        // SVG transform order matters: translate -> rotate -> scale
        // But for Center-based rotation, it's specific. 
        // Let's use the standard format we likely used in getTransform
        transformStr = `translate(${x}, ${y}) rotate(${r}) scale(${sx}, ${sy})`;
    }

    path.setAttribute("transform", transformStr);
}

// Auto Init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMobileDragDrop, 1000); // Wait for DOM
});

// --- UTILITIES ---
function makeElementDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "Header");
    if (header) {
        // if present, the header is where you move the DIV from:
        header.onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// --- SCALING & TRANSFORM HELPERS ---
// --- SCALING & TRANSFORM HELPERS ---
function getTransform(key) {
    const path = document.getElementById(key);
    if (!path) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

    // Parse existing transform
    const tStr = path.getAttribute("transform") || "";
    // Default
    let res = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

    // Simple regex parse (assuming we generate it uniformly)
    // translate(x, y) rotate(r) scale(sx, sy)
    const trMatch = tStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (trMatch) { res.x = parseFloat(trMatch[1]); res.y = parseFloat(trMatch[2]); }

    const rotMatch = tStr.match(/rotate\(([^)]+)\)/);
    if (rotMatch) res.rotation = parseFloat(rotMatch[1]);

    const scMatch = tStr.match(/scale\(([^,]+),\s*([^)]+)\)/);
    if (scMatch) { res.scaleX = parseFloat(scMatch[1]); res.scaleY = parseFloat(scMatch[2]); }

    return res;
}

function scalePart(dx, dy) {
    if (window.selectedDomElement) {
        // DOM Scaling logic
        const el = window.selectedDomElement;
        const style = window.getComputedStyle(el);

        if (dx !== 0) {
            let w = parseInt(el.style.width || el.offsetWidth);
            el.style.width = (w + dx * 10) + "px";
        }
        if (dy !== 0) {
            // Change Font Size on Y axis?
            let fs = parseInt(style.fontSize);
            el.style.fontSize = (fs + dy) + "px";
        }
        return;
    }

    if (!window.selectedPartKey) return;
    let t = getTransform(window.selectedPartKey);

    const steps = 0.1;
    let changeX = 0;
    let changeY = 0;

    if (Math.abs(dx) < 2) { changeX = dx; }
    else { changeX = (dx > 0 ? steps : -steps); }

    if (Math.abs(dy) < 2) { changeY = dy; }
    else { changeY = (dy > 0 ? steps : -steps); }

    t.scaleX += changeX;
    t.scaleY += changeY;

    if (Math.abs(t.scaleX) < 0.1) t.scaleX = 0.1 * (t.scaleX < 0 ? -1 : 1);
    if (Math.abs(t.scaleY) < 0.1) t.scaleY = 0.1 * (t.scaleY < 0 ? -1 : 1);

    updateAndSave(t);
}

function movePart(dx, dy) {
    if (window.selectedDomElement) {
        // DOM Move logic
        const el = window.selectedDomElement;
        // Ensure position is relative or absolute
        const style = window.getComputedStyle(el);
        if (style.position === 'static') el.style.position = 'relative';

        let left = parseInt(el.style.left) || 0;
        let top = parseInt(el.style.top) || 0;

        el.style.left = (left + dx * 2) + "px";
        el.style.top = (top + dy * 2) + "px";
        return;
    }

    if (!window.selectedPartKey) return;
    let t = getTransform(window.selectedPartKey);
    t.x += dx * MOVE_STEP;
    t.y += dy * MOVE_STEP;
    updateAndSave(t);
}

function rotatePart(deg) {
    if (window.selectedDomElement) return; // Rotation not implemented for DOM yet (complex layout)

    if (!window.selectedPartKey) return;
    let t = getTransform(window.selectedPartKey);
    t.rotation += deg;
    updateAndSave(t);
}

function resetPart() {
    if (window.selectedDomElement) {
        window.selectedDomElement.style.left = '';
        window.selectedDomElement.style.top = '';
        window.selectedDomElement.style.width = '';
        window.selectedDomElement.style.fontSize = '';
        return;
    }

    if (!window.selectedPartKey) return;
    const t = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    updateAndSave(t);
}

function updateAndSave(t) {
    const path = window.selectedPartElement || document.getElementById(window.selectedPartKey);
    if (!path) return;

    updatePartTransform(path, t);

    // Save to schema object in memory
    const type = window.activeKasa;
    if (carSchemas[type]) {
        carSchemas[type][window.selectedPartKey + "_transform"] = t;
    }
}

function selectPartForEdit(key, path) {
    if (window.selectedPartPath) {
        window.selectedPartPath.style.stroke = "#333";
        window.selectedPartPath.style.strokeWidth = "2px";
    }
    window.selectedPartKey = key;
    window.selectedPartPath = path;
    window.selectedPartElement = path; // Alias
    path.style.stroke = "#2563eb"; // Highlight blue
    path.style.strokeWidth = "3px";

    const statusDiv = document.getElementById('editorStatus');
    if (statusDiv) statusDiv.innerText = `SeÃ§ili: ${key}`;
}

// Global functions for UI buttons
window.resetSchema = function () {
    if (!window.activeKasa || !carSchemas[window.activeKasa]) return;
    if (!confirm("TÃ¼m parÃ§a dÃ¼zenlemelerini sÄ±fÄ±rlamak istediÄŸinize emin misiniz?")) return;

    // Clear transforms
    const keys = Object.keys(carSchemas[window.activeKasa]);
    keys.forEach(k => {
        if (k.endsWith('_transform')) delete carSchemas[window.activeKasa][k];
    });

    loadVisuals(window.activeKasa);
    // showToast from main.js or here?
    if (window.showToast) window.showToast('Åema varsayÄ±lan hale getirildi.');
};

// Placeholder for drawing mode if drawing script not loaded
if (!window.toggleDrawingMode) {
    window.toggleDrawingMode = function () {
        console.warn("Drawing module not loaded.");
        if (canvas) {
            // If canvas logic exists inside car-render but not exposed?
            // Not implemented here.
        }
    };
}
 *cascade08× *cascade08×Ú*cascade08ÚÛ *cascade08ÛŞ*cascade08Şß *cascade08ßà*cascade08àã *cascade08ãä*cascade08äæ *cascade08æç*cascade08çé *cascade08éì*cascade08ìí *cascade08íî*cascade08îï *cascade08ïğ*cascade08ğñ *cascade08ñò*cascade08òó *cascade08óõ*cascade08õö *cascade08ö÷*cascade08÷ù *cascade08ùû*cascade08ûı *cascade08ı*cascade08‚ *cascade08‚‰*cascade08‰Š *cascade08Š‹*cascade08‹Œ *cascade08Œ*cascade08 *cascade08’*cascade08’“ *cascade08“—*cascade08—™ *cascade08™š*cascade08š› *cascade08›œ*cascade08œ *cascade08 *cascade08 ¡ *cascade08¡£*cascade08£¬ *cascade08¬°*cascade08°± *cascade08±³*cascade08³´ *cascade08´µ*cascade08µ· *cascade08·¹*cascade08¹º *cascade08º¾*cascade08¾¿ *cascade08¿Á*cascade08ÁÆ *cascade08ÆÈ*cascade08ÈÍ *cascade08ÍÎ*cascade08ÎĞ *cascade08ĞÓ*cascade08ÓÖ *cascade08Öİ*cascade08İç *cascade08çí*cascade08íî *cascade08îï*cascade08ïğ *cascade08ğò*cascade08òó *cascade08óö*cascade08öø *cascade08øü*cascade08üı *cascade08ış*cascade08ş *cascade08‰*cascade08‰Š *cascade08Š*cascade08 *cascade08˜*cascade08˜™ *cascade08™ *cascade08 ¡ *cascade08¡¥*cascade08¥¦ *cascade08¦§*cascade08§© *cascade08©¯*cascade08¯ş *cascade08şÿ*cascade08ÿƒ *cascade08ƒ«*cascade08«˜ *cascade08˜µ *cascade08µĞ*cascade08Ğ³ *cascade08³»*cascade08»¾ *cascade08¾À*cascade08ÀÁ *cascade08ÁÄ*cascade08ÄÅ *cascade08ÅË*cascade08ËÌ *cascade08ÌÒ*cascade08ÒÔ *cascade08ÔÜ*cascade08Üá *cascade08áå*cascade08åæ *cascade08æí*cascade08í÷ *cascade08÷ù*cascade08ù *cascade08›*cascade08›¤ *cascade08¤É*cascade08ÉÊ *cascade08ÊŞ*cascade08Ş˜ *cascade08˜œ*cascade08œ *cascade08Ÿ*cascade08Ÿ  *cascade08 ¡*cascade08¡¢ *cascade08¢¦*cascade08¦§ *cascade08§­*cascade08­® *cascade08®´*cascade08´µ *cascade08µº*cascade08º» *cascade08»É*cascade08ÉÊ *cascade08ÊË *cascade08ËÏ*cascade08ÏĞ *cascade08ĞÔ*cascade08ÔÕ *cascade08Õè*cascade08èé *cascade08éê*cascade08êë *cascade08ëî*cascade08îï *cascade08ï—*cascade08—˜ *cascade08˜™ *cascade08™š *cascade08š*cascade08 *cascade08Ÿ *cascade08Ÿ *cascade08 ¢ *cascade08¢¤*cascade08¤¦ *cascade08¦¨*cascade08¨¬ *cascade08¬®*cascade08®± *cascade08±²*cascade08²³ *cascade08³´*cascade08´µ *cascade08µ¹*cascade08¹º *cascade08º¿*cascade08¿À *cascade08ÀÁ*cascade08ÁÄ *cascade08ÄÅ*cascade08ÅÆ*cascade08ÆÇ*cascade08ÇÈ *cascade08ÈÉ*cascade08ÉÊ*cascade08ÊÜ*cascade08Üİ *cascade08İß*cascade08ßà *cascade08àã*cascade08ãä *cascade08äé*cascade08éê *cascade08êì*cascade08ìí *cascade08íî *cascade08îò*cascade08òó *cascade08óö*cascade08ö÷ *cascade08÷ø*cascade08ø *cascade08‚*cascade08‚ƒ *cascade08ƒ*cascade08 *cascade08‘*cascade08‘’ *cascade08’£*cascade08£¤ *cascade08¤¥ *cascade08¥¦*cascade08¦§ *cascade08§¨*cascade08¨©*cascade08©ª *cascade08ª°*cascade08°¶ *cascade08¶·*cascade08·¹ *cascade08¹¾*cascade08¾¿ *cascade08¿Á*cascade08ÁÂ *cascade08ÂÃ*cascade08ÃÆ *cascade08ÆÊ*cascade08ÊË *cascade08ËÔ*cascade08Ô× *cascade08×Ù*cascade08Ùå *cascade08åæ *cascade08æó *cascade08óõ *cascade08õ÷*cascade08÷ù *cascade08ùû *cascade08ûı*cascade08ı‚ *cascade08‚„*cascade08„ˆ *cascade08ˆŠ*cascade08Š *cascade08*cascade08 *cascade08“*cascade08“” *cascade08”• *cascade08•–*cascade08–—*cascade08—˜ *cascade08˜™*cascade08™Ÿ *cascade08Ÿ *cascade08 ¤ *cascade08¤¥*cascade08¥¨ *cascade08¨©*cascade08©µ *cascade08µ¶ *cascade08¶¹ *cascade08¹º*cascade08º»*cascade08»Ä *cascade08ÄÆ *cascade08ÆÈ*cascade08ÈÊ *cascade08ÊÌ *cascade08ÌÎ*cascade08ÎÓ *cascade08Ó×*cascade08×Ş *cascade08Şâ*cascade08âã *cascade08ãä*cascade08äå *cascade08åæ *cascade08æë*cascade08ëì *cascade08ìô *cascade08ô*cascade08‘ *cascade08‘”*cascade08”• *cascade08•—*cascade08—™ *cascade08™¡*cascade08¡¢ *cascade08¢³*cascade08³´ *cascade08´µ *cascade08µ¸ *cascade08¸¹ *cascade08¹º *cascade08ºË*cascade08ËÌ *cascade08Ì×*cascade08×Ø *cascade08ØÙ *cascade08ÙŞ*cascade08Şß *cascade08ßà *cascade08àä*cascade08äæ *cascade08æé*cascade08éì *cascade08ìí *cascade08íğ*cascade08ğó *cascade08ó‚*cascade08‚ƒ*cascade08ƒ„ *cascade08„‰*cascade08‰Š *cascade08Š*cascade08 *cascade08”*cascade08”• *cascade08•˜*cascade08˜™ *cascade08™ª*cascade08ª« *cascade08«µ*cascade08µ¶ *cascade08¶Ô*cascade08ÔÕ*cascade08Õß*cascade08ßà *cascade08àñ*cascade08ñò *cascade08òó *cascade08óô*cascade08ôõ *cascade08õ‘*cascade08‘“ *cascade08“”*cascade08”˜ *cascade08˜«*cascade08«® *cascade08®¸*cascade08¸¹ *cascade08¹¼*cascade08¼½ *cascade08½Å*cascade08ÅÆ *cascade08Æö*cascade08öú *cascade08úü*cascade08üı *cascade08ı*cascade08… *cascade08…*cascade08 *cascade08—*cascade08—™ *cascade08™*cascade08Ÿ *cascade08Ÿ­*cascade08­® *cascade08®³*cascade08³´ *cascade08´ä*cascade08äè *cascade08èê*cascade08êö *cascade08ö÷ *cascade08÷ø*cascade08øù*cascade08ùˆ *cascade08ˆŠ*cascade08Š *cascade08*cascade08• *cascade08•—*cascade08—› *cascade08›Ÿ*cascade08Ÿ¡*cascade08¡¢ *cascade08¢£ *cascade08£¨*cascade08¨ª *cascade08ª­*cascade08­± *cascade08±²*cascade08²³ *cascade08³¶*cascade08¶· *cascade08·¹*cascade08¹º *cascade08º¿ *cascade08¿Á*cascade08ÁÄ *cascade08ÄÅ*cascade08ÅÆ *cascade08ÆĞ*cascade08ĞÓ *cascade08ÓÕ *cascade08ÕÙ*cascade08Ùå *cascade08åç*cascade08çê *cascade08êì*cascade08ìí *cascade08íğ*cascade08ğó *cascade08ó† *cascade08†Š*cascade08Š› *cascade08›œ*cascade08œ  *cascade08 ¡ *cascade08¡® *cascade08®ß*cascade08ßá *cascade08áé *cascade08éë*cascade08ëì *cascade08ìî*cascade08îï *cascade08ïğ*cascade08ğñ *cascade08ñó*cascade08óô *cascade08ôõ*cascade08õ÷ *cascade08÷ø*cascade08øú *cascade08úû *cascade08ûı*cascade08ıÿ *cascade08ÿ€*cascade08€„ *cascade08„…*cascade08…† *cascade08†‡*cascade08‡ˆ *cascade08ˆ‰*cascade08‰‹ *cascade08‹Œ*cascade08Œ *cascade08‘*cascade08‘’ *cascade08’“*cascade08“• *cascade08•–*cascade08–  *cascade08 £*cascade08£¦ *cascade08¦§*cascade08§¨ *cascade08¨©*cascade08©« *cascade08«¬*cascade08¬® *cascade08®´*cascade08´¶ *cascade08¶¹*cascade08¹º *cascade08º»*cascade08»¾ *cascade08¾Â*cascade08ÂÅ*cascade08ÅÇ *cascade08ÇÉ *cascade08ÉÍ*cascade08ÍÎ *cascade08ÎÏ*cascade08ÏÆ *cascade08ÆÇ*cascade08Ç¨ *cascade08¨«*cascade08«ï *cascade08ïò*cascade08òù! *cascade08ù!ü!*cascade08ü!¦" *cascade08¦"¯)*cascade08¯)‹+ *cascade08‹++*cascade08+Ó. *cascade08Ó.×.*cascade08×.è2 *cascade08è2È6*cascade08È6ÚE *cascade08ÚEÚE*cascade08ÚEÛE *cascade08ÛEàE*cascade08àEâE *cascade08âEíE*cascade08íEF *cascade08F‚F*cascade08‚F»G *cascade08»G‚H*cascade08‚HˆH *cascade08ˆHŠH*cascade08ŠH‹H *cascade08‹HH*cascade08HH *cascade08HH*cascade08H‘H *cascade08‘H“H*cascade08“H•H *cascade08•H–H*cascade08–H˜H *cascade08˜H™H*cascade08™H H *cascade08 H¢H*cascade08¢H¤H *cascade08¤H«H*cascade08«H®H *cascade08®H°H*cascade08°H±H *cascade08±H³H*cascade08³H´H *cascade08´H»H*cascade08»HÂH *cascade08ÂHÇH*cascade08ÇHÈH *cascade08ÈHÉH*cascade08ÉHÊH *cascade08ÊHÌH*cascade08ÌHÍH *cascade08ÍHÕH*cascade08ÕHØH *cascade08ØHİH*cascade08İHßH *cascade08ßHàH*cascade08àHáH *cascade08áHâH*cascade08âHãH *cascade08ãHçH*cascade08çHëH *cascade08ëHïH*cascade08ïH¥I *cascade08¥I×I*cascade08×IóI *cascade08óIúI*cascade08úI…J *cascade08…JJ*cascade08J©J *cascade08©J®J*cascade08®J»J *cascade08»JâJ*cascade08âJîJ *cascade08îJôJ*cascade08ôJK *cascade08KK*cascade08K©K *cascade08©KÌK*cascade08ÌKÍK *cascade08ÍKÎK*cascade08ÎKÑK *cascade08ÑKØK*cascade08ØKÚK *cascade08ÚKòK*cascade08òK÷K *cascade08÷KøK*cascade08øKùK *cascade08ùKûK*cascade08ûKÿK *cascade08ÿK L*cascade08 LÀL *cascade08ÀLİL*cascade08İLûL *cascade08ûL¸N*cascade08¸NÀN *cascade08ÀNÂN*cascade08ÂNôN *cascade08ôNñO*cascade08ñO´T *cascade08´TÏZ*cascade08ÏZÙ` *cascade08Ù`ñb*cascade08ñb›e *cascade08›eŸe *cascade08Ÿe¢e*cascade08¢e£e *cascade08£e¦e*cascade08¦e§e *cascade08§e¨e*cascade08¨e©e *cascade08©e³e*cascade08³eµe *cascade08µe·e*cascade08·e¾e *cascade08¾e¿e*cascade08¿eÀe *cascade08ÀeÃe*cascade08ÃeÄe *cascade08ÄeÆe*cascade08ÆeÂf *cascade08ÂfØf*cascade08Øf’g *cascade08’g“g*cascade08“g»g *cascade08»gêg*cascade08êgëg *cascade08ëgìg*cascade08ìgîg *cascade08îgúg*cascade08úgûg *cascade08ûg„h*cascade08„hh *cascade08hh*cascade08h½h *cascade08½h¾h*cascade08¾hÁh *cascade08ÁhÂh*cascade08Âhi *cascade08ii*cascade08iši *cascade08ši›i*cascade08›i­i *cascade08­i·i*cascade08·iÈi *cascade08Èi€j*cascade08€j„j *cascade08„j†j*cascade08†jŠj *cascade08Šjj*cascade08jj *cascade08j‘j*cascade08‘j’j *cascade08’jj*cascade08jŸj *cascade08Ÿj¨j*cascade08¨j©j *cascade08©j°j*cascade08°j³j *cascade08³j¶j*cascade08¶jÉj *cascade08ÉjÛj*cascade08Ûjñj*cascade08ñjøj *cascade08øjŒk*cascade08Œkk *cascade08kk*cascade08kk *cascade08kk*cascade08k‘k *cascade08‘k™k*cascade08™k›k *cascade08›kœk*cascade08œkk *cascade08kŸk*cascade08Ÿk¡k *cascade08¡k¢k*cascade08¢k£k *cascade08£k¤k*cascade08¤k¨k *cascade08¨k»k*cascade08»kËk *cascade08ËkÌk*cascade08ÌkØk *cascade08ØkÙk*cascade08ÙkÚk *cascade08Úkİk*cascade08İkŞk *cascade08Şkäk*cascade08äkåk *cascade08åkîk*cascade08îkïk *cascade08ïkôk*cascade08ôkõk *cascade08õkùk*cascade08ùkûk *cascade08ûk€l*cascade08€ll *cascade08l„l*cascade08„l…l *cascade08…l‰l*cascade08‰lŠl *cascade08Šll*cascade08l—l *cascade08—l˜l*cascade08˜l®l *cascade08®l¯l*cascade08¯l½l *cascade08½lÜl*cascade08Ülòl *cascade08òlœm*cascade08œmm *cascade08m£m*cascade08£m¹m *cascade08¹mÖm*cascade08ÖmØm *cascade08ØmÛm*cascade08ÛmÜm *cascade08Ümßm*cascade08ßmám *cascade08ámãm*cascade08ãmäm *cascade08ämæm*cascade08æmém *cascade08émîm*cascade08îmïm *cascade08ïmòm*cascade08òmóm *cascade08ómúm*cascade08úmûm *cascade08ûmÿm*cascade08ÿm€n *cascade08€n…n*cascade08…n†n *cascade08†nŒn*cascade08Œnn *cascade08n–n*cascade08–n—n *cascade08—n˜n*cascade08˜n™n *cascade08™n›n*cascade08›nn *cascade08nŸn *cascade08Ÿn¡n *cascade08¡n¥n*cascade08¥n§n *cascade08§n¬n*cascade08¬n­n *cascade08­nÁn*cascade08ÁnØn *cascade08Øn†o *cascade08†o™o*cascade08™oºo *cascade08ºo¿o *cascade08¿oºr*cascade08ºrär *cascade08ärår*cascade08åròr *cascade08òr÷r*cascade08÷rˆs *cascade08ˆsÑs*cascade08ÑsÖs *cascade08Ösès*cascade08èsìs*cascade08ìsşs *cascade08şs€t *cascade08€t„t*cascade08„tt *cascade08t˜t *cascade08˜tœt*cascade08œt¥t *cascade08¥tªt*cascade08ªt­t *cascade08­t®t*cascade08®t°t *cascade08°t½t*cascade08½tÀt *cascade08ÀtÄt*cascade08ÄtÈt*cascade08Èt‚u *cascade08‚uŠu*cascade08Šuu *cascade08uu*cascade08u•u *cascade08•u–u*cascade08–u¸u *cascade08¸uÅu *cascade08ÅuÚu *cascade08ÚuÛu*cascade08Ûuóu *cascade08óuõu*cascade08õu÷u *cascade08÷uv*cascade08v´v *cascade08´v¸v*cascade08¸vÄv *cascade08ÄvÈv*cascade08ÈvÜv *cascade08Üvİv*cascade08İvùv *cascade08ùv‰w*cascade08‰wµw *cascade08µw¶w*cascade08¶wÂw *cascade08ÂwÅw*cascade08ÅwÉw*cascade08Éwİw *cascade08İwŞw*cascade08Şwöw *cascade08öwøw*cascade08øwúw *cascade08úw‘x*cascade08‘x¸x *cascade08¸xºx*cascade08ºxÆx *cascade08ÆxÊx *cascade08ÊxÌx*cascade08ÌxÓx*cascade08ÓxÔx *cascade08ÔxŞx*cascade08Şxßx *cascade08ßxäx*cascade08äxåx *cascade08åxæx*cascade08æxçx *cascade08çxñx*cascade08ñxòx *cascade08òxõx*cascade08õx÷x *cascade08÷xúx*cascade08úxûx *cascade08ûxÿx*cascade08ÿx€y *cascade08€y…y*cascade08…y†y *cascade08†yˆy*cascade08ˆy‰y *cascade08‰yŒy*cascade08Œyy *cascade08yy*cascade08yy *cascade08y—y*cascade08—y˜y *cascade08˜y›y*cascade08›yy *cascade08y¥y*cascade08¥y¦y *cascade08¦y¬y*cascade08¬y®y *cascade08®y¯y*cascade08¯y°y *cascade08°y±y*cascade08±y²y *cascade08²y·y*cascade08·y¹y *cascade08¹y¼y*cascade08¼y½y *cascade08½yÁy*cascade08ÁyÂy *cascade08ÂyÅy*cascade08ÅyÈy *cascade08ÈyÌy*cascade08ÌyÍy *cascade08ÍyÖy*cascade08ÖyÙy *cascade08Ùyßy*cascade08ßyëy *cascade08ëyïy*cascade08ïy„z *cascade08„z…z*cascade08…z z *cascade08 z­z*cascade08­zØz *cascade08ØzÚz*cascade08ÚzŞz *cascade08Şzâz*cascade08âzƒ{ *cascade08ƒ{„{*cascade08„{Ÿ{ *cascade08Ÿ{°{*cascade08°{İ{ *cascade08İ{à{*cascade08à{ì{ *cascade08ì{ğ{*cascade08ğ{ñ{*cascade08ñ{†| *cascade08†|‡|*cascade08‡|œ| *cascade08œ||*cascade08|£| *cascade08£|±|*cascade08±|İ| *cascade08İ|ß|*cascade08ß|ã| *cascade08ã|è}*cascade08è}ğ} *cascade08ğ}ô}*cascade08ô}ü} *cascade08ü}€~*cascade08€~‘~ *cascade08‘~’~*cascade08’~“~ *cascade08“~—~*cascade08—~¡~ *cascade08¡~©~ *cascade08©~­~*cascade08­~¹~ *cascade08¹~Ğ~*cascade08Ğ~Ş~ *cascade08Ş~à~*cascade08à~ã~ *cascade08ã~ç~*cascade08ç~è~ *cascade08è~*cascade08ƒ *cascade08ƒŒ*cascade08Œ *cascade08*cascade08 *cascade08 *cascade08 ¡ *cascade08¡ª*cascade08ª« *cascade08«¯*cascade08¯° *cascade08°Ê*cascade08ÊË *cascade08ËÛ*cascade08ÛÜ *cascade08Üæ*cascade08æè *cascade08èƒ€*cascade08ƒ€…€ *cascade08…€‡€*cascade08‡€‹€ *cascade08‹€€*cascade08€€ *cascade08€‘€ *cascade08‘€“€*cascade08“€”€ *cascade08”€š€*cascade08š€›€ *cascade08›€œ€*cascade08œ€€ *cascade08€¢€*cascade08¢€£€ *cascade08£€¤€*cascade08¤€¥€ *cascade08¥€¬€*cascade08¬€®€ *cascade08®€¼€*cascade08¼€¾€ *cascade08¾€ä€*cascade08ä€å€ *cascade08å€…*cascade08… *cascade08‘*cascade08‘™ *cascade08™À*cascade08ÀÔ *cascade08ÔÕ*cascade08Õ× *cascade08×Ø*cascade08Øú *cascade08úş*cascade08ş‹‚ *cascade08‹‚‚*cascade08‚¢‚ *cascade08¢‚£‚*cascade08£‚¥‚ *cascade08¥‚¨‚*cascade08¨‚©‚ *cascade08©‚¬‚*cascade08¬‚Ä‚ *cascade08Ä‚Å‚*cascade08Å‚Ù‚ *cascade08Ù‚Û‚*cascade08Û‚Ü‚ *cascade08Ü‚ß‚*cascade08ß‚å‚ *cascade08å‚í‚*cascade08í‚ø‚ *cascade08ø‚ù‚*cascade08ù‚ü‚*cascade08ü‚‰ƒ *cascade08‰ƒŒƒ*cascade08Œƒ¡ƒ *cascade08¡ƒ¢ƒ*cascade08¢ƒ£ƒ *cascade08£ƒ¦ƒ*cascade08¦ƒ§ƒ *cascade08§ƒªƒ*cascade08ªƒÃƒ *cascade08ÃƒÅƒ*cascade08ÅƒÙƒ *cascade08ÙƒÛƒ*cascade08ÛƒÜƒ *cascade08Üƒàƒ*cascade08àƒçƒ *cascade08çƒñƒ*cascade08ñƒüƒ *cascade08üƒşƒ*cascade08şƒ†„ *cascade08†„ˆ„ *cascade08ˆ„Œ„*cascade08Œ„›„ *cascade08›„¡„ *cascade08¡„¥„*cascade08¥„¨„ *cascade08¨„ª„*cascade08ª„»„ *cascade08»„½„*cascade08½„¿„ *cascade08¿„À„*cascade08À„Á„ *cascade08Á„Â„ *cascade08Â„Ã„ *cascade08Ã„Ä„*cascade08Ä„Å„ *cascade08Å„Æ„ *cascade08Æ„È„*cascade08È„É„ *cascade08É„Ê„*cascade08Ê„Ë„ *cascade08Ë„Í„*cascade08Í„Î„ *cascade08Î„Ò„*cascade08Ò„Ó„ *cascade08Ó„Ô„ *cascade08Ô„Õ„*cascade08Õ„Ö„ *cascade08Ö„×„*cascade08×„Ø„ *cascade08Ø„Ü„*cascade08Ü„ß„ *cascade08ß„ã„*cascade08ã„ö„ *cascade08ö„÷„ *cascade08÷„û„*cascade08û„ı„ *cascade08ı„›…*cascade08›…œ… *cascade08œ……*cascade08…Ÿ… *cascade08Ÿ…§… *cascade08§…·…*cascade08·…»… *cascade08»…¿…*cascade08¿…À… *cascade08À…Á… *cascade08Á…Ğ…*cascade08Ğ…Ñ… *cascade08Ñ…Ò…*cascade08Ò…Ó… *cascade08Ó…Õ…*cascade08Õ…Ö… *cascade08Ö…Û…*cascade08Û…Ü… *cascade08Ü…Ş…*cascade08Ş…ã… *cascade08ã…æ… *cascade08æ…ñ… *cascade08ñ…ò…*cascade08ò…ó… *cascade08ó…ö…*cascade08ö…÷… *cascade08÷…û…*cascade08û…ü… *cascade08ü…ı… *cascade08ı…ÿ…*cascade08ÿ…€† *cascade08€††*cascade08†„† *cascade08„†…† *cascade08…†‰†*cascade08‰†Š† *cascade08Š†–†*cascade08–†š† *cascade08š†œ†*cascade08œ†† *cascade08†¡†*cascade08¡†£† *cascade08£†´† *cascade08´†µ†*cascade08µ†¶† *cascade08¶†·†*cascade08·†½† *cascade08½†¾† *cascade08¾†È†*cascade08È†Ó† *cascade08Ó†×†*cascade08×†Ú†*cascade08Ú†û† *cascade08û†ü†*cascade08ü†ş† *cascade08ş†‰‡ *cascade08‰‡Š‡*cascade08Š‡‹‡ *cascade08‹‡‡*cascade08‡‡ *cascade08‡“‡*cascade08“‡”‡ *cascade08”‡•‡ *cascade08•‡‡*cascade08‡Ÿ‡ *cascade08Ÿ‡§‡*cascade08§‡¨‡ *cascade08¨‡«‡*cascade08«‡¬‡ *cascade08¬‡­‡ *cascade08­‡®‡*cascade08®‡¯‡ *cascade08¯‡°‡*cascade08°‡³‡ *cascade08³‡´‡ *cascade08´‡¶‡*cascade08¶‡·‡ *cascade08·‡»‡*cascade08»‡½‡ *cascade08½‡Î‡ *cascade08Î‡Ò‡*cascade08Ò‡Ô‡ *cascade08Ô‡Õ‡*cascade08Õ‡Ö‡ *cascade08Ö‡×‡*cascade08×‡Ø‡ *cascade08Ø‡Ù‡ *cascade08Ù‡Û‡*cascade08Û‡á‡ *cascade08á‡ì‡ *cascade08ì‡ğ‡*cascade08ğ‡ø‡ *cascade08ø‡ü‡*cascade08ü‡„ˆ *cascade08„ˆ†ˆ*cascade08†ˆˆ *cascade08ˆ‘ˆ*cascade08‘ˆ”ˆ*cascade08”ˆ•ˆ *cascade08•ˆ¢ˆ*cascade08¢ˆ£ˆ *cascade08£ˆ¤ˆ *cascade08¤ˆÏˆ*cascade08ÏˆĞˆ *cascade08ĞˆÓˆ*cascade08ÓˆÔˆ *cascade08ÔˆØˆ*cascade08ØˆÙˆ *cascade08ÙˆÛˆ*cascade08ÛˆÜˆ *cascade08ÜˆŞˆ*cascade08Şˆßˆ *cascade08ßˆèˆ*cascade08èˆêˆ *cascade08êˆîˆ*cascade08îˆğˆ *cascade08ğˆ”‰*cascade08”‰•‰ *cascade08•‰œ‰*cascade08œ‰‰ *cascade08‰£‰*cascade08£‰¤‰ *cascade08¤‰­‰*cascade08­‰®‰ *cascade08®‰Ã‰*cascade08Ã‰Ä‰ *cascade08Ä‰Ë‰*cascade08Ë‰Í‰ *cascade08Í‰Ö‰*cascade08Ö‰Ø‰ *cascade08Ø‰ß‰*cascade08ß‰á‰ *cascade08á‰ş‰*cascade08ş‰€Š *cascade08€ŠŠ *cascade08Š‚Š *cascade08‚Š„Š*cascade08„Š…Š *cascade08…Š‡Š *cascade08‡ŠšŠ*cascade08šŠ›Š *cascade08›Š¥Š*cascade08¥Š¦Š *cascade08¦Š»Š*cascade08»Š¼Š *cascade08¼Š¿Š*cascade08¿ŠÀŠ *cascade08ÀŠÂŠ*cascade08ÂŠÄŠ *cascade08ÄŠÍŠ*cascade08ÍŠÏŠ *cascade08ÏŠÓŠ*cascade08ÓŠÔŠ *cascade08ÔŠÖŠ*cascade08ÖŠØŠ *cascade08ØŠİŠ*cascade08İŠŞŠ *cascade08ŞŠéŠ*cascade08éŠêŠ *cascade08êŠòŠ*cascade08òŠóŠ *cascade08óŠøŠ*cascade08øŠùŠ *cascade08ùŠúŠ *cascade08úŠûŠ *cascade08ûŠ–‹*cascade08–‹—‹ *cascade08—‹°‹*cascade08°‹±‹ *cascade08±‹Ä‹*cascade08Ä‹Å‹ *cascade08Å‹Æ‹ *cascade08Æ‹È‹ *cascade08È‹Ê‹*cascade08Ê‹Ë‹ *cascade08Ë‹Í‹*cascade08Í‹Ï‹ *cascade08Ï‹è‹*cascade08è‹é‹ *cascade08é‹ö‹*cascade08ö‹÷‹ *cascade08÷‹ı‹*cascade08ı‹ş‹ *cascade08ş‹²Œ*cascade08²Œ´Œ *cascade08´Œ¿Œ*cascade08¿ŒÀŒ *cascade08ÀŒÁŒ*cascade08ÁŒÂŒ *cascade08ÂŒÈŒ*cascade08ÈŒÉŒ*cascade08ÉŒÓŒ*cascade08ÓŒØŒ *cascade08ØŒêŒ*cascade08êŒëŒ *cascade08ëŒìŒ*cascade08ìŒíŒ *cascade08íŒòŒ*cascade08òŒóŒ *cascade08óŒ¬*cascade08¬´ *cascade08´¸*cascade08¸¹ *cascade08¹»*cascade08»¼ *cascade08¼¾*cascade08¾Á *cascade08ÁÃ*cascade08ÃÅ *cascade08Åõ*cascade08õö *cascade08ö*cascade08Ÿ *cascade08Ÿ¤*cascade08¤¥ *cascade08¥©*cascade08©ª *cascade08ªÌ*cascade08ÌÍ *cascade08Íò*cascade08òó *cascade08óô *cascade08ô€*cascade08€ *cascade08‡*cascade08‡ˆ *cascade08ˆ˜*cascade08˜™ *cascade08™¿*cascade08¿Á *cascade08Á‚*cascade08‚Á *cascade08ÁÂ *cascade08ÂÃ*cascade08ÃÄ *cascade08ÄÆ*cascade08ÆÇ *cascade08ÇÏ*cascade08ÏÑ *cascade08ÑÒ*cascade08ÒÓ *cascade08Ó×*cascade08×Ø *cascade08ØÙ*cascade08Ùß *cascade08ßá*cascade08áè *cascade08èë*cascade08ëÍ‘ *cascade08Í‘Ï‘ *cascade08Ï‘ë‘*cascade08ë‘ü‘ *cascade08ü‘ÿ‘*cascade08ÿ‘ª’ *cascade08ª’®’*cascade08®’à’ *cascade08à’â’ *cascade08â’ÿ’*cascade08ÿ’—“ *cascade08—“›“*cascade08›“§“ *cascade08§“Ø– *cascade08Ø–Ù–*cascade08Ù–â– *cascade08â–ã–*cascade08ã–ä– *cascade08ä–ê–*cascade08ê–ë– *cascade08ë–ğ–*cascade08ğ–ñ– *cascade08ñ–ø–*cascade08ø–ú– *cascade08ú–ƒ—*cascade08ƒ—…— *cascade08…——*cascade08—‘— *cascade08‘—œ—*cascade08œ—ï— *cascade08ï—Š˜*cascade08Š˜™˜ *cascade08™˜§˜*cascade08§˜¨˜ *cascade08¨˜¬˜*cascade08¬˜¯˜ *cascade08¯˜˜™*cascade08˜™™™ *cascade08™™¨™*cascade08¨™©™ *cascade08©™«™*cascade08«™¬™ *cascade08¬™³™*cascade08³™´™ *cascade08´™¾™*cascade08¾™¿™ *cascade08¿™Ò™*cascade08Ò™Ó™ *cascade08Ó™Ü™*cascade08Ü™İ™ *cascade08İ™”š*cascade08”š–š *cascade08–š®š*cascade08®š¯š *cascade08¯š‚›*cascade08‚›„› *cascade08„›•›*cascade08•›¢› *cascade08¢›Õ›*cascade08Õ›Ö› *cascade08Ö›ë›*cascade08ë›ì› *cascade08ì›î›*cascade08î›ï› *cascade08ï›ü›*cascade08ü›–œ *cascade08–œšœ *cascade08šœÍœ*cascade08Íœñœ *cascade08ñœ– *cascade08–›*cascade08›¡ *cascade08¡¤*cascade08¤© *cascade08©«*cascade08«¬ *cascade08¬­*cascade08­® *cascade08®¯*cascade08¯² *cascade08²³*cascade08³´ *cascade08´µ*cascade08µ¶ *cascade08¶·*cascade08·¸ *cascade08¸¹*cascade08¹½ *cascade08½¾*cascade08¾Â *cascade08ÂÄ*cascade08ÄÆ *cascade08ÆÈ*cascade08ÈÉ *cascade08ÉÊ*cascade08ÊÔ *cascade08ÔÖ*cascade08Ö× *cascade08×Û*cascade08ÛÜ *cascade08Üß*cascade08ßà *cascade08àá*cascade08áã *cascade08ãå*cascade08åï *cascade08ïğ*cascade08ğó *cascade08ó÷*cascade08÷ø *cascade08øù*cascade08ùú *cascade08úû*cascade08ûı *cascade08ış*cascade08şÿ *cascade08ÿ€*cascade08€ƒ *cascade08ƒ†*cascade08†‡ *cascade08‡‰*cascade08‰Š *cascade08Š‘*cascade08‘  *cascade08 ¡*cascade08¡£ *cascade08£¦*cascade08¦© *cascade08©ª*cascade08ª« *cascade08«¬*cascade08¬­ *cascade08­¯*cascade08¯° *cascade08°²*cascade08²´ *cascade08´·*cascade08·¸ *cascade08¸¾*cascade08¾¿ *cascade08¿Ã*cascade08ÃÄ *cascade08ÄÆ*cascade08ÆÈ *cascade08ÈÉ*cascade08ÉÏ *cascade08ÏÒ*cascade08ÒÓ *cascade08ÓÔ*cascade08ÔØ *cascade08ØÚ*cascade08ÚÜ *cascade08Üà*cascade08àá *cascade08áã*cascade08ãä *cascade08äæ*cascade08æî *cascade08îñ*cascade08ñô *cascade08ôõ*cascade08õ÷ *cascade08÷ø*cascade08øú *cascade08úû*cascade08ûü *cascade08ü‚Ÿ*cascade08‚ŸƒŸ *cascade08ƒŸ„Ÿ*cascade08„Ÿ…Ÿ *cascade08…Ÿ†Ÿ*cascade08†Ÿ‡Ÿ *cascade08‡Ÿ‰Ÿ*cascade08‰ŸŸ *cascade08Ÿ‘Ÿ*cascade08‘Ÿ“Ÿ *cascade08“Ÿ•Ÿ*cascade08•Ÿ˜Ÿ *cascade08˜ŸšŸ*cascade08šŸ›Ÿ *cascade08›ŸŸ*cascade08ŸŸ *cascade08ŸŸŸ*cascade08ŸŸ Ÿ *cascade08 Ÿ¡Ÿ*cascade08¡Ÿ£Ÿ *cascade08£Ÿ¤Ÿ*cascade08¤Ÿ¥Ÿ *cascade08¥Ÿ§Ÿ*cascade08§Ÿ¨Ÿ *cascade08¨Ÿ©Ÿ*cascade08©ŸªŸ *cascade08ªŸ¬Ÿ*cascade08¬Ÿ®Ÿ *cascade08®Ÿ±Ÿ*cascade08±Ÿ²Ÿ *cascade08²Ÿ³Ÿ*cascade08³Ÿ»Ÿ *cascade08»Ÿ¿Ÿ*cascade08¿ŸÀŸ *cascade08ÀŸÂŸ*cascade08ÂŸÅŸ *cascade08ÅŸÆŸ*cascade08ÆŸÈŸ *cascade08ÈŸÉŸ*cascade08ÉŸÊŸ *cascade08ÊŸËŸ*cascade08ËŸÒŸ *cascade08ÒŸÖŸ*cascade08ÖŸ×Ÿ *cascade08×ŸØŸ*cascade08ØŸÛŸ *cascade08ÛŸİŸ*cascade08İŸŞŸ *cascade08ŞŸßŸ*cascade08ßŸåŸ *cascade08åŸõŸ*cascade08õŸüŸ *cascade08üŸıŸ*cascade08ıŸşŸ *cascade08şŸ€ *cascade08€ ‚  *cascade08‚ ƒ *cascade08ƒ „  *cascade08„ … *cascade08… †  *cascade08† ‡ *cascade08‡ ‹  *cascade08‹ Œ *cascade08Œ œ  *cascade08œ  *cascade08   *cascade08   *cascade08  £  *cascade08£ ¤ *cascade08¤ ¦  *cascade08¦ ± *cascade08± ¹  *cascade08¹ » *cascade08» ¼  *cascade08¼ ¿ *cascade08¿ À  *cascade08À Á *cascade08Á Â  *cascade08Â Ã *cascade08Ã Ä  *cascade08Ä É *cascade08É Í  *cascade08Í Î *cascade08Î Ò  *cascade08Ò Ó *cascade08Ó Õ  *cascade08Õ Ö *cascade08Ö Ø  *cascade08Ø Ú *cascade08Ú Ü  *cascade08Ü İ *cascade08İ Ş  *cascade08Ş ã *cascade08ã ä  *cascade08ä ç *cascade08ç ğ  *cascade08ğ ò *cascade08ò ô  *cascade08ô ö *cascade08ö ˆ¡ *cascade08ˆ¡Œ¡*cascade08Œ¡¡ *cascade08¡¡*cascade08¡¡ *cascade08¡“¡*cascade08“¡”¡ *cascade08”¡•¡*cascade08•¡–¡ *cascade08–¡™¡*cascade08™¡š¡ *cascade08š¡¡*cascade08¡§¡ *cascade08§¡©¡*cascade08©¡ª¡ *cascade08ª¡­¡*cascade08­¡¯¡ *cascade08¯¡²¡*cascade08²¡´¡ *cascade08´¡µ¡*cascade08µ¡·¡ *cascade08·¡¼¡*cascade08¼¡¾¡ *cascade08¾¡Á¡*cascade08Á¡Â¡ *cascade08Â¡Ã¡*cascade08Ã¡Ë¡ *cascade08Ë¡Í¡*cascade08Í¡Î¡ *cascade08Î¡Ï¡*cascade08Ï¡Ó¡ *cascade08Ó¡Ú¡*cascade08Ú¡Ü¡ *cascade08Ü¡à¡*cascade08à¡â¡ *cascade08â¡é¡*cascade08é¡ê¡ *cascade08ê¡ë¡*cascade08ë¡ì¡ *cascade08ì¡î¡*cascade08î¡ğ¡ *cascade08ğ¡ñ¡*cascade08ñ¡ò¡ *cascade08ò¡÷¡*cascade08÷¡ø¡ *cascade08ø¡ù¡*cascade08ù¡û¡ *cascade08û¡ş¡*cascade08ş¡ÿ¡ *cascade08ÿ¡ƒ¢*cascade08ƒ¢…¢ *cascade08…¢†¢*cascade08†¢‡¢ *cascade08‡¢‰¢*cascade08‰¢‹¢ *cascade08‹¢¢*cascade08¢¢ *cascade08¢’¢*cascade08’¢˜¢ *cascade08˜¢¢*cascade08¢¡¢ *cascade08¡¢¢¢*cascade08¢¢¤¢ *cascade08¤¢¦¢*cascade08¦¢§¢ *cascade08§¢¨¢*cascade08¨¢©¢ *cascade08©¢¯¢*cascade08¯¢°¢ *cascade08°¢³¢*cascade08³¢´¢ *cascade08´¢·¢*cascade08·¢¸¢ *cascade08¸¢½¢*cascade08½¢¾¢ *cascade08¾¢Á¢*cascade08Á¢Â¢ *cascade08Â¢Ì¢*cascade08Ì¢Î¢ *cascade08Î¢Ñ¢*cascade08Ñ¢Ó¢ *cascade08Ó¢Õ¢*cascade08Õ¢Ö¢ *cascade08Ö¢×¢*cascade08×¢Ù¢ *cascade08Ù¢Ú¢*cascade08Ú¢Ü¢ *cascade08Ü¢Ş¢*cascade08Ş¢ß¢ *cascade08ß¢à¢*cascade08à¢å¢ *cascade08å¢æ¢*cascade08æ¢è¢ *cascade08è¢ê¢*cascade08ê¢ë¢ *cascade08ë¢î¢*cascade08î¢ï¢ *cascade08ï¢ñ¢*cascade08ñ¢ô¢ *cascade08ô¢õ¢*cascade08õ¢ö¢ *cascade08ö¢ú¢*cascade08ú¢û¢ *cascade08û¢ı¢*cascade08ı¢ş¢ *cascade08ş¢ÿ¢*cascade08ÿ¢‰£ *cascade08‰£Š£*cascade08Š£‹£ *cascade08‹£“£*cascade08“£¥£ *cascade08¥£¦£*cascade08¦£¨£ *cascade08¨£ª£*cascade08ª£½£ *cascade08½£Á£*cascade08Á£Â£ *cascade08Â£Ã£*cascade08Ã£Å£ *cascade08Å£Æ£*cascade08Æ£Ç£ *cascade08Ç£É£*cascade08É£Ë£ *cascade08Ë£Í£*cascade08Í£Î£ *cascade08Î£Ï£*cascade08Ï£Ğ£ *cascade08Ğ£Ó£*cascade08Ó£Ú£ *cascade08Ú£ß£*cascade08ß£â£ *cascade08â£å£*cascade08å£è£ *cascade08è£é£*cascade08é£ğ£ *cascade08ğ£ñ£*cascade08ñ£ó£ *cascade08ó£ö£*cascade08ö£ù£ *cascade08ù£ú£*cascade08ú£û£ *cascade08û£ı£*cascade08ı£ş£ *cascade08ş£ƒ¤*cascade08ƒ¤„¤ *cascade08„¤†¤*cascade08†¤‰¤ *cascade08‰¤‹¤*cascade08‹¤Œ¤ *cascade08Œ¤¤*cascade08¤¤ *cascade08¤”¤*cascade08”¤–¤ *cascade08–¤—¤*cascade08—¤™¤ *cascade08™¤›¤*cascade08›¤Ÿ¤ *cascade08Ÿ¤£¤*cascade08£¤¤¤ *cascade08¤¤«¤*cascade08«¤±¤ *cascade08±¤²¤*cascade08²¤´¤ *cascade08´¤·¤*cascade08·¤º¤ *cascade08º¤¼¤*cascade08¼¤¾¤ *cascade08¾¤¿¤*cascade08¿¤À¤ *cascade08À¤Á¤*cascade08Á¤Â¤ *cascade08Â¤Ä¤*cascade08Ä¤Ç¤ *cascade08Ç¤Ë¤*cascade08Ë¤Ï¤ *cascade08Ï¤Ò¤*cascade08Ò¤Ú¤ *cascade08Ú¤Û¤*cascade08Û¤Ü¤ *cascade08Ü¤á¤*cascade08á¤â¤ *cascade08â¤ã¤*cascade08ã¤æ¤ *cascade08æ¤ç¤*cascade08ç¤õ¤ *cascade08õ¤ö¤*cascade08ö¤ø¤ *cascade08ø¤ú¤*cascade08ú¤ı¤ *cascade08ı¤ş¤*cascade08ş¤‹¥ *cascade08‹¥Œ¥*cascade08Œ¥¥ *cascade08¥¥*cascade08¥ ¥ *cascade08 ¥¤¥*cascade08¤¥¥¥ *cascade08¥¥¦¥*cascade08¦¥¶¥ *cascade08¶¥º¥*cascade08º¥»¥ *cascade08»¥½¥*cascade08½¥Â¥ *cascade08Â¥Ä¥*cascade08Ä¥Å¥ *cascade08Å¥É¥*cascade08É¥Í¥ *cascade08Í¥Ğ¥*cascade08Ğ¥Ú¥ *cascade08Ú¥Ü¥*cascade08Ü¥İ¥ *cascade08İ¥Ş¥*cascade08Ş¥à¥ *cascade08à¥â¥*cascade08â¥ã¥ *cascade08ã¥ä¥*cascade08ä¥å¥ *cascade08å¥æ¥*cascade08æ¥é¥ *cascade08é¥ì¥ *cascade08ì¥ï¥*cascade08ï¥ğ¥ *cascade08ğ¥ô¥*cascade08ô¥ö¥ *cascade08ö¥÷¥*cascade08÷¥ø¥ *cascade08ø¥ú¥*cascade08ú¥û¥ *cascade08û¥ı¥*cascade08ı¥ş¥ *cascade08ş¥ÿ¥*cascade08ÿ¥‚¦ *cascade08‚¦ƒ¦*cascade08ƒ¦„¦ *cascade08„¦…¦*cascade08…¦†¦ *cascade08†¦ˆ¦*cascade08ˆ¦‰¦ *cascade08‰¦‹¦*cascade08‹¦Œ¦ *cascade08Œ¦¦*cascade08¦¦ *cascade08¦¦*cascade08¦‘¦ *cascade08‘¦•¦*cascade08•¦š¦ *cascade08š¦›¦*cascade08›¦œ¦ *cascade08œ¦¦*cascade08¦¦ *cascade08¦§¦*cascade08§¦®¦ *cascade08®¦°¦*cascade08°¦²¦ *cascade08²¦³¦*cascade08³¦¶¦ *cascade08¶¦¹¦*cascade08¹¦»¦ *cascade08»¦Á¦*cascade08Á¦Ã¦ *cascade08Ã¦Ç¦*cascade08Ç¦Ë¦ *cascade08Ë¦Ì¦*cascade08Ì¦Î¦ *cascade08Î¦Ğ¦*cascade08Ğ¦×¦ *cascade08×¦Ş¦*cascade08Ş¦ß¦ *cascade08ß¦à¦*cascade08à¦á¦ *cascade08á¦ä¦*cascade08ä¦å¦ *cascade08å¦ì¦*cascade08ì¦í¦ *cascade08í¦ğ¦*cascade08ğ¦ñ¦ *cascade08ñ¦ó¦*cascade08ó¦ô¦ *cascade08ô¦õ¦*cascade08õ¦û¦ *cascade08û¦ı¦*cascade08ı¦ƒ§ *cascade08ƒ§…§*cascade08…§‡§ *cascade08‡§ˆ§*cascade08ˆ§‰§ *cascade08‰§§*cascade08§‘§ *cascade08‘§•§*cascade08•§—§ *cascade08—§›§*cascade08›§œ§ *cascade08œ§§*cascade08§§ *cascade08§¢§*cascade08¢§£§ *cascade08£§¥§*cascade08¥§¨§ *cascade08¨§«§*cascade08«§¬§ *cascade08¬§¯§*cascade08¯§¸§ *cascade08¸§º§*cascade08º§¼§ *cascade08¼§Ã§*cascade08Ã§È§ *cascade08È§Ë§*cascade08Ë§Ì§ *cascade08Ì§Ó§*cascade08Ó§Ô§ *cascade08Ô§Ö§*cascade08Ö§×§ *cascade08×§Ù§*cascade08Ù§à§ *cascade08à§æ§ *cascade08æ§é§*cascade08é§ê§ *cascade08ê§ì§*cascade08ì§ğ§ *cascade08ğ§¨ *cascade08¨’¨*cascade08’¨“¨ *cascade08“¨•¨*cascade08•¨˜¨ *cascade08˜¨£¨ £¨¤¨*cascade08¤¨¥¨ ¥¨§¨*cascade08§¨¨¨ ¨¨«¨*cascade08«¨­¨ ­¨®¨*cascade08®¨°¨ *cascade08°¨³¨*cascade08³¨´¨ *cascade08´¨¶¨*cascade08¶¨·¨ *cascade08·¨¸¨*cascade08¸¨¹¨ *cascade08¹¨¿¨*cascade08¿¨À¨ *cascade08À¨Á¨*cascade08Á¨Â¨ *cascade08Â¨Ä¨*cascade08Ä¨Æ¨ *cascade08Æ¨È¨*cascade08È¨Ò¨ *cascade08Ò¨Õ¨*cascade08Õ¨Ö¨ *cascade08Ö¨Ø¨*cascade08Ø¨Ú¨ *cascade08Ú¨Û¨*cascade08Û¨Ü¨ *cascade08Ü¨İ¨*cascade08İ¨ß¨ *cascade08ß¨á¨*cascade08á¨â¨ *cascade08â¨ä¨*cascade08ä¨å¨ *cascade08å¨æ¨*cascade08æ¨ç¨ *cascade08ç¨è¨*cascade08è¨é¨ *cascade08é¨ê¨*cascade08ê¨ë¨ *cascade08ë¨ì¨*cascade08ì¨í¨ *cascade08í¨î¨*cascade08î¨ï¨ *cascade08ï¨ğ¨*cascade08ğ¨ñ¨ *cascade08ñ¨ó¨*cascade08ó¨ú¨ *cascade08ú¨û¨*cascade08û¨ş¨ *cascade08ş¨ÿ¨*cascade08ÿ¨© *cascade08©ƒ©*cascade08ƒ©…© *cascade08…©‡©*cascade08‡©‰© *cascade08‰©‹©*cascade08‹©Œ© *cascade08Œ©”©*cascade08”©•© *cascade08•©–©*cascade08–©—© *cascade08—©™©*cascade08™©¤© *cascade08¤©«©*cascade08«©¬© *cascade08¬©¯©*cascade08¯©°© *cascade08°©µ©*cascade08µ©¸© *cascade08¸©¿©*cascade08¿©É© *cascade08É©Ì©*cascade08Ì©Ô© *cascade08Ô©×©*cascade08×©Ø© *cascade08Ø©İ©*cascade08İ©Ş© *cascade08Ş©ß©*cascade08ß©á© *cascade08á©ã©*cascade08ã©å© *cascade08å©æ©*cascade08æ©ç© *cascade08ç©ë©*cascade08ë©î© *cascade08î©ï©*cascade08ï©ğ© *cascade08ğ©ó©*cascade08ó©õ© *cascade08õ©÷©*cascade08÷©ª *cascade08ªƒª*cascade08ƒª…ª *cascade08…ª‡ª*cascade08‡ªŠª *cascade08ŠªŒª*cascade08Œªª *cascade08ªª*cascade08ª’ª *cascade08’ª“ª*cascade08“ª–ª *cascade08–ª™ª*cascade08™ªšª *cascade08šªª*cascade08ª¤ª *cascade08¤ª¥ª*cascade08¥ª¨ª *cascade08¨ª©ª*cascade08©ª­ª *cascade08­ª¯ª*cascade08¯ª°ª *cascade08°ª²ª*cascade08²ª´ª *cascade08´ªµª*cascade08µª¸ª *cascade08¸ªºª*cascade08ºª»ª *cascade08»ª¼ª*cascade08¼ª¿ª *cascade08¿ªÀª*cascade08ÀªÁª *cascade08ÁªÂª*cascade08ÂªÄª *cascade08ÄªÇª*cascade08ÇªÉª *cascade08ÉªÊª*cascade08ÊªÒª *cascade08Òªèª*cascade08èªéª *cascade08éªûª*cascade08ûªüª *cascade08üª€«*cascade08€«« *cascade08««*cascade08«« *cascade08«œ«*cascade08œ«« *cascade08«Î«*cascade08Î«Ñ« *cascade08Ñ«Ó«*cascade08Ó«Õ« *cascade08Õ«Ö«*cascade08Ö«×« *cascade08×«Ú«*cascade08Ú«Û« *cascade08Û«Ü«*cascade08Ü«İ« *cascade08İ«Ş«*cascade08Ş«ß« *cascade08ß«à«*cascade08à«æ« *cascade08æ«è«*cascade08è«é« *cascade08é«ì«*cascade08ì«í« *cascade08í«ï«*cascade08ï«ğ« *cascade08ğ«ø«*cascade08ø«û« *cascade08û«Î­*cascade08Î­Ø­*cascade08Ø­Ù­ *cascade08Ù­á­*cascade08á­ä­ *cascade08ä­å­*cascade08å­ç­ *cascade08ç­é­*cascade08é­ê­ *cascade08ê­ë­*cascade08ë­í­ *cascade08í­ï­*cascade08ï­ğ­ *cascade08ğ­ñ­*cascade08ñ­ó­ *cascade08ó­ô­*cascade08ô­ö­ *cascade08ö­÷­*cascade08÷­ı­ *cascade08ı­ÿ­*cascade08ÿ­ƒ® *cascade08ƒ®‡®*cascade08‡®ˆ® *cascade08ˆ®®*cascade08®‘® *cascade08‘®“®*cascade08“®”® *cascade08”®•®*cascade08•®–® *cascade08–®™®*cascade08™®š® *cascade08š®›®*cascade08›® ® *cascade08 ®¹®*cascade08¹®º® *cascade08º®¼®*cascade08¼®½® *cascade08½®¾®*cascade08¾®¿® *cascade08¿®Å®*cascade08Å®Æ® *cascade08Æ®È®*cascade08È®Ì® *cascade08Ì®Ó®*cascade08Ó®Ş® *cascade08Ş®à®*cascade08à®á® *cascade08á®ã®*cascade08ã®ä® *cascade08ä®ç®*cascade08ç®é® *cascade08é®ê®*cascade08ê®ï® *cascade08ï®ò®*cascade08ò®õ® *cascade08õ®ø®*cascade08ø®ù® *cascade08ù®ú®*cascade08ú®û® *cascade08û®ı®*cascade08ı®ÿ® *cascade08ÿ®‚¯*cascade08‚¯ƒ¯ *cascade08ƒ¯…¯*cascade08…¯‡¯ *cascade08‡¯‰¯*cascade08‰¯‹¯ *cascade08‹¯’¯*cascade08’¯“¯ *cascade08“¯¡¯*cascade08¡¯¤¯ *cascade08¤¯¥¯*cascade08¥¯¦¯ *cascade08¦¯©¯*cascade08©¯ª¯ *cascade08ª¯­¯*cascade08­¯®¯ *cascade08®¯±¯*cascade08±¯²¯ *cascade08²¯³¯*cascade08³¯»¯ *cascade08»¯Â¯*cascade08Â¯Æ¯ *cascade08Æ¯È¯*cascade08È¯É¯ *cascade08É¯Ê¯*cascade08Ê¯Ë¯ *cascade08Ë¯Í¯*cascade08Í¯Î¯ *cascade08Î¯Ñ¯*cascade08Ñ¯Ó¯ *cascade08Ó¯Ô¯*cascade08Ô¯á¯ *cascade08á¯â¯*cascade08â¯ã¯ *cascade08ã¯ä¯*cascade08ä¯è¯ *cascade08è¯é¯*cascade08é¯ì¯ *cascade08ì¯î¯*cascade08î¯ò¯ *cascade08ò¯ó¯*cascade08ó¯ô¯ *cascade08ô¯õ¯*cascade08õ¯ù¯ *cascade08ù¯ú¯*cascade08ú¯ü¯ *cascade08ü¯ş¯*cascade08ş¯ÿ¯ *cascade08ÿ¯°*cascade08°…° *cascade08…°†°*cascade08†°‡° *cascade08‡°‹°*cascade08‹°”° *cascade08”°™°*cascade08™°° *cascade08°Ÿ°*cascade08Ÿ° ° *cascade08 °¤°*cascade08¤°¥° *cascade08¥°«°*cascade08«°¬° *cascade08¬°­°*cascade08­°®° *cascade08®°¯°*cascade08¯°°° *cascade08°°´°*cascade08´°µ° *cascade08µ°¸°*cascade08¸°¹° *cascade08¹°º°*cascade08º°»° *cascade08»°¼°*cascade08¼°Â° *cascade08Â°É°*cascade08É°Ê° *cascade08Ê°Ì°*cascade08Ì°Í° *cascade08Í°Ö°*cascade08Ö°×° *cascade08×°Ü°*cascade08Ü°Ş° *cascade08Ş°à°*cascade08à°á° *cascade08á°ä°*cascade08ä°å° *cascade08å°ì°*cascade08ì°í° *cascade08í°ï°*cascade08ï°ğ° *cascade08ğ°ñ°*cascade08ñ°ó° *cascade08ó°õ°*cascade08õ°ö° *cascade08ö°÷°*cascade08÷°ø° *cascade08ø°ù°*cascade08ù°û° *cascade08û°ı°*cascade08ı°ş° *cascade08ş°ƒ±*cascade08ƒ±‹± *cascade08‹±±*cascade08±‘± *cascade08‘±“±*cascade08“±”± *cascade08”±–±*cascade08–±—± *cascade08—±š±*cascade08š±œ± *cascade08œ±Ÿ±*cascade08Ÿ± ± *cascade08 ±¢±*cascade08¢±¤± *cascade08¤±¥±*cascade08¥±¦± *cascade08¦±¨±*cascade08¨±ª± *cascade08ª±®±*cascade08®±¯± *cascade08¯±°±*cascade08°±±± *cascade08±±³±*cascade08³±´± *cascade08´±¶±*cascade08¶±·± *cascade08·±¸±*cascade08¸±¹± *cascade08¹±º±*cascade08º±»± *cascade08»±¼±*cascade08¼±¾± *cascade08¾±¿±*cascade08¿±À± *cascade08À±Â±*cascade08Â±Ã± *cascade08Ã±Ä±*cascade08Ä±Å± *cascade08Å±È±*cascade08È±Ì± *cascade08Ì±Ğ±*cascade08Ğ±Ñ± *cascade08Ñ±Ó±*cascade08Ó±Õ± *cascade08Õ±Ö±*cascade08Ö±×± *cascade08×±Ø±*cascade08Ø±Ú± *cascade08Ú±Û±*cascade08Û±Ü± *cascade08Ü±İ±*cascade08İ±ß± *cascade08ß±á±*cascade08á±å± *cascade08å±ç±*cascade08ç±è± *cascade08è±ë±*cascade08ë±ì± *cascade08ì±í±*cascade08í±ï± *cascade08ï±ğ±*cascade08ğ±ñ± *cascade08ñ±ó±*cascade08ó±ÿ± *cascade08ÿ±€²*cascade08€²² *cascade08²ƒ²*cascade08ƒ²„² *cascade08„²†²*cascade08†²ˆ² *cascade08ˆ²Š²*cascade08Š²‹² *cascade08‹²Œ²*cascade08Œ²² *cascade08²²*cascade08²² *cascade08²‘²*cascade08‘²’² *cascade08’²“²*cascade08“²•² *cascade08•²–²*cascade08–²˜² *cascade08˜²š²*cascade08š²œ² *cascade08œ²²*cascade08²Ÿ² *cascade08Ÿ²£²*cascade08£²¥² *cascade08¥²¦²*cascade08¦²¬² *cascade08¬²¯²*cascade08¯²°² *cascade08°²±²*cascade08±²²² *cascade08²²¶²*cascade08¶²·² *cascade08·²¸²*cascade08¸²¹² *cascade08¹²»²*cascade08»²½² *cascade08½²¿²*cascade08¿²À² *cascade08À²Á²*cascade08Á²Â² *cascade08Â²Ã²*cascade08Ã²Ä² *cascade08Ä²Æ²*cascade08Æ²Ù² *cascade08Ù²ß²*cascade08ß²á² *cascade08á²â² *cascade08â²ã² *cascade08ã²ä²*cascade08ä²å² *cascade08å²æ²*cascade08æ²é² *cascade08é²ê²*cascade08ê²í² *cascade08í²î²*cascade08î²ï² *cascade08ï²ò²*cascade08ò²ô² *cascade08ô²õ²*cascade08õ²ö² *cascade08ö²÷²*cascade08÷²ù² *cascade08ù²ú²*cascade08ú²ü² *cascade08ü²ı²*cascade08ı²ş² *cascade08ş²€³*cascade08€³™³ *cascade08™³³*cascade08³ ³ *cascade08 ³¡³*cascade08¡³¢³ *cascade08¢³£³*cascade08£³¤³ *cascade08¤³¥³*cascade08¥³¦³ *cascade08¦³®³*cascade08®³±³ *cascade08±³³³*cascade08³³µ³ *cascade08µ³»³*cascade08»³½³ *cascade08½³¾³*cascade08¾³Â³ *cascade08Â³Ä³*cascade08Ä³Å³ *cascade08Å³Ç³*cascade08Ç³È³ *cascade08È³É³*cascade08É³Ê³ *cascade08Ê³Ì³*cascade08Ì³Ù³ *cascade08Ù³æ³*cascade08æ³ç³ *cascade08ç³ê³*cascade08ê³ë³ *cascade08ë³î³*cascade08î³ï³ *cascade08ï³ñ³*cascade08ñ³ò³ *cascade08ò³ó³*cascade08ó³ô³ *cascade08ô³÷³*cascade08÷³ø³ *cascade08ø³ı³*cascade08ı³€´ *cascade08€´´*cascade08´‚´ *cascade08‚´„´*cascade08„´†´ *cascade08†´‡´*cascade08‡´‰´ *cascade08‰´‹´*cascade08‹´Œ´ *cascade08Œ´´*cascade08´´ *cascade08´´*cascade08´’´ *cascade08’´´*cascade08´¡´ *cascade08¡´¥´*cascade08¥´¦´ *cascade08¦´Æ´*cascade08Æ´³· *cascade08³·‡Û *cascade08‡ÛäÛ *cascade08äÛåÛ*cascade08åÛæÛ *cascade08æÛçÛ*cascade08çÛñÛ *cascade08ñÛôÛ*cascade08ôÛõÛ *cascade08õÛ÷Û*cascade08÷ÛùÛ *cascade08ùÛúÛ*cascade08úÛûÛ *cascade08ûÛƒÜ*cascade08ƒÜ„Ü *cascade08„Ü‹Ü*cascade08‹ÜŒÜ *cascade08ŒÜÜ*cascade08ÜÜ *cascade08Ü‘Ü*cascade08‘Ü’Ü *cascade08’Ü¡Ü*cascade08¡Ü§Ü *cascade08§Ü©Ü*cascade08©ÜªÜ *cascade08ªÜ­Ü*cascade08­Ü²Ü *cascade08²Ü·Ü*cascade08·Ü¸Ü *cascade08¸ÜºÜ*cascade08ºÜ»Ü *cascade08»Ü¿Ü*cascade08¿ÜÀÜ *cascade08ÀÜÃÜ*cascade08ÃÜÄÜ *cascade08ÄÜÅÜ*cascade08ÅÜÈÜ *cascade08ÈÜËÜ*cascade08ËÜÎÜ *cascade08ÎÜĞÜ*cascade08ĞÜÒÜ *cascade08ÒÜÓÜ*cascade08ÓÜ×Ü *cascade08×ÜÚÜ*cascade08ÚÜİÜ *cascade08İÜàÜ*cascade08àÜâÜ *cascade08âÜåÜ*cascade08åÜçÜ *cascade08çÜíÜ*cascade08íÜîÜ *cascade08îÜïÜ*cascade08ïÜğÜ *cascade08ğÜõÜ*cascade08õÜöÜ *cascade08öÜ÷Ü*cascade08÷ÜûÜ *cascade08ûÜüÜ*cascade08üÜıÜ *cascade08ıÜÿÜ*cascade08ÿÜİ *cascade08İ‡İ*cascade08‡İ‰İ *cascade08‰İŠİ*cascade08ŠİŒİ *cascade08Œİİ*cascade08İ–İ *cascade08–İİ*cascade08İŸİ *cascade08Ÿİ¤İ*cascade08¤İ­İ *cascade08­İÈİ*cascade08ÈİÒİ *cascade08ÒİÙİ*cascade08Ùİâİ *cascade08âİãİ*cascade08ãİäİ *cascade08äİåİ*cascade08åİæİ *cascade08æİêİ*cascade08êİìİ *cascade08ìİıİ*cascade08ıİşİ *cascade08şİÿİ*cascade08ÿİ€Ş *cascade08€Ş”Ş*cascade08”Ş•Ş *cascade08•ŞœŞ*cascade08œŞŞ *cascade08ŞŞ*cascade08ŞŸŞ *cascade08ŸŞ§Ş*cascade08§Ş©Ş *cascade08©Ş«Ş*cascade08«Ş¬Ş *cascade08¬Ş»Ş*cascade08»Ş¼Ş *cascade08¼Ş½Ş*cascade08½Ş¾Ş *cascade08¾ŞÀŞ*cascade08ÀŞÁŞ *cascade08ÁŞÅŞ*cascade08ÅŞÆŞ *cascade08ÆŞÉŞ*cascade08ÉŞÊŞ *cascade08ÊŞÔŞ*cascade08ÔŞÕŞ *cascade08ÕŞÜŞ*cascade08ÜŞâŞ *cascade08âŞæŞ*cascade08æŞèŞ *cascade08èŞìŞ*cascade08ìŞùŞ *cascade08ùŞıŞ*cascade08ıŞ€ß *cascade08€ß„ß*cascade08„ßß *cascade08ß’ß*cascade08’ß™ß *cascade08™ßœß*cascade08œß¤ß *cascade08¤ß¨ß*cascade08¨ß¯ß *cascade08¯ß³ß*cascade08³ß´ß *cascade08´ß¶ß*cascade08¶ß·ß *cascade08·ß¸ß*cascade08¸ß¹ß *cascade08¹ß¼ß*cascade08¼ß½ß *cascade08½ßÁß*cascade08ÁßÂß *cascade08ÂßÃß*cascade08ÃßÄß *cascade08ÄßÉß*cascade08ÉßÊß *cascade08ÊßËß*cascade08ËßÌß *cascade08ÌßÍß*cascade08ÍßÎß *cascade08ÎßÕß*cascade08ÕßÖß *cascade08Öß×ß*cascade08×ßØß *cascade08Øßìß*cascade08ìßíß *cascade08íßïß*cascade08ïßğß *cascade08ğßòß*cascade08òßôß *cascade08ôßöß*cascade08ößøß *cascade08øßùß*cascade08ùßüß *cascade08üß€à*cascade08€àà *cascade08à‚à*cascade08‚àƒà *cascade08ƒà…à*cascade08…à‡à *cascade08‡à‰à*cascade08‰à‹à *cascade08‹àà*cascade08àà *cascade08à‘à*cascade08‘à’à *cascade08’à™à*cascade08™à›à *cascade08›à¦à*cascade08¦à¬à *cascade08¬à­à*cascade08­à®à *cascade08®à¶à*cascade08¶à¸à *cascade08¸à¼à*cascade08¼à½à *cascade08½à¾à*cascade08¾à¿à *cascade08¿àÂà*cascade08ÂàÃà *cascade08ÃàÅà*cascade08ÅàÆà *cascade08ÆàÕà*cascade08ÕàÖà *cascade08ÖàØà*cascade08ØàÙà *cascade08ÙàÚà*cascade08ÚàÜà *cascade08Üàâà*cascade08âàäà *cascade08äàåà*cascade08åàçà *cascade08çàïà*cascade08ïàğà *cascade08ğà’á*cascade08’á“á *cascade08“á—á*cascade08—á˜á *cascade08˜áá*cascade08áŸá *cascade08Ÿá á*cascade08 á¢á *cascade08¢á¥á*cascade08¥á¦á *cascade08¦áªá*cascade08ªá«á *cascade08«á¬á*cascade08¬á­á *cascade08­á´á*cascade08´á»á *cascade08»áÀâ *cascade08ÀâÄí*cascade08Äíîí *cascade08îí–î*cascade08–î²õ *cascade08²õÁù*cascade08Áùµş *cascade08µş·‚*cascade08·‚„„ *cascade08„„ë„*cascade08ë„’† *cascade08’†¦ˆ*cascade08¦ˆÇ *cascade08Ç˜*cascade082Ffile:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/car-render.js