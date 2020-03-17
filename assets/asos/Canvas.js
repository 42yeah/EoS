import { Bar } from "./Bar.js";


class Canvas {
    constructor(canvas, algorithm) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext("2d");
        this.id = canvas.getAttribute("t");
        this.data = [];
        this.algorithm = algorithm;

        this.barWidth = 0;
        this.prevT = 0.0;
        this.dt = 0.0;
        this.sorting = false;

        this.stopClock = -1.0;
        this.n = +canvas.getAttribute("n");

        this.clear();
    }

    generate() {
        this.data = [];
        this.sorting = false;
        this.stopClock = -1.0;
        this.algorithm.reset();
        this.barWidth = this.width / this.n - 1; // 1 pixel for spacing
        for (let i = 0; i < this.n; i++) {
            let v = Math.floor(Math.random() * 100);
            let height = Math.floor(this.height * (v / 100.0));
            this.data.push(new Bar(i * (this.barWidth + 1), this.height - height, this.barWidth, height, v));
        }
    }

    sort() {
        this.sorting = true;
    }

    render(t) {
        if (t == undefined) {
            return;
        }
        this.clear();
        // Calculate delta time
        this.dt = (t - this.prevT) / 1000.0;
        this.prevT = t;

        this.ctx.fillStyle = "#ffa42c";
        let allOfThemAlmostStill = true;
        for (let i = 0; i < this.data.length; i++) {
            const bar = this.data[i];
            bar.update(this.dt);
            if (!bar.almostStill()) {
                allOfThemAlmostStill = false;
            }
            this.ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
        }
        if (allOfThemAlmostStill && this.sorting) {
            const ret = this.algorithm.exec(this);
            if (ret) {
                if (this.stopClock <= 0.0) {
                    this.stopClock = t;
                }
                if (t - this.stopClock >= 5000.0) {
                    this.sorting = false;
                }
            }
        }
    }

    swap(a, b) {
        // Boundary check... As usual
        if (a < 0 || b < 0 || a >= this.data.length || b >= this.data.length) { return; }
        this.data[a].tx = b * (this.barWidth + 1);
        this.data[b].tx = a * (this.barWidth + 1);

        // Also swap their indexes
        const tmp = this.data[a];
        this.data[a] = this.data[b];
        this.data[b] = tmp;
    }

    clear() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}

export { Canvas };
