å/class CarCanvas {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.mode = 'pen'; // pen, eraser
        this.color = options.color || '#ef4444'; // Red default
        this.lineWidth = options.lineWidth || 3;

        this.history = [];
        this.historyStep = -1;

        this.init();
    }

    init() {
        this.canvas.className = 'drawing-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '50'; // Above SVG (z-index 10 usually)
        this.canvas.style.pointerEvents = 'none'; // Default pass-through to SVG
        this.canvas.style.touchAction = 'none'; // Prevent scrolling while drawing

        this.container.style.position = 'relative'; // Ensure container is relative
        this.container.appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.attachEvents();
    }

    enableDrawing(enable) {
        if (enable) {
            this.canvas.style.pointerEvents = 'all';
            this.canvas.style.cursor = 'crosshair';
            this.container.classList.add('drawing-mode');
        } else {
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.cursor = 'default';
            this.container.classList.remove('drawing-mode');
        }
    }

    resize() {
        // Match container size exactly
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.redraw(); // Keep content on resize (simple version)
    }

    attachEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const start = (e) => {
            if (this.canvas.style.pointerEvents === 'none') return;
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;

            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.mode === 'eraser' ? 'rgba(0,0,0,1)' : this.color;
            this.ctx.globalCompositeOperation = this.mode === 'eraser' ? 'destination-out' : 'source-over';
            this.ctx.lineWidth = this.lineWidth;
        };

        const move = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);

            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();

            this.lastX = pos.x;
            this.lastY = pos.y;
        };

        const end = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            this.isDrawing = false;
            this.ctx.closePath();
            this.saveState(); // Push to history
        };

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('mouseup', end);
        this.canvas.addEventListener('mouseout', end);

        this.canvas.addEventListener('touchstart', start);
        this.canvas.addEventListener('touchmove', move);
        this.canvas.addEventListener('touchend', end);
    }

    setColor(color) {
        this.color = color;
        this.mode = 'pen';
    }

    setMode(mode) {
        this.mode = mode;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }

    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.canvas.toDataURL());
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.drawImage(img, 0, 0);
            };
        } else {
            this.clear();
            this.historyStep = -1;
            this.history = [];
        }
    }

    redraw() {
        if (this.historyStep >= 0 && this.history[this.historyStep]) {
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                // Note: simple redraw scaling might distort if aspect ratio changes heavily
            };
        }
    }

    getDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    loadFromDataURL(url) {
        if (!url) return;
        const img = new Image();
        img.src = url;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        };
    }
}

// Expose globally
window.CarCanvas = CarCanvas;
å/*cascade082Gfile:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/draw-canvas.js