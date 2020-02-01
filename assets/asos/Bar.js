class Bar {
    constructor(x, y, w, h, v) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.v = v;
        this.tx = -1;
        this.ty = -1;
    }

    update(dt) {
        if (this.tx != -1) {
            const dx = this.tx - this.x;
            this.x += dx * (dt * 5.0);
        }
        if (this.ty != -1) {
            const dy = this.ty - this.y;
            this.y += dy * (dt * 5.0);
        }
    }

    almostStill() {
        if (this.tx == -1 && this.ty == -1) {
            return true;
        }
        if (this.ty == -1) {
            return Math.abs(this.tx - this.x) <= this.w / 3.0;
        }
        if (this.tx == -1) {
            return Math.abs(this.ty - this.y) <= this.w / 3.0;
        }
    }
}

export { Bar };
