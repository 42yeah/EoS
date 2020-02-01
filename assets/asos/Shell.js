class Shell {
    constructor() {
        this.reset();
    }

    reset() {
        this.gaps = [ 10, 5, 2, 1 ];
        this.currentGap = 0;
        this.i = this.gaps[this.currentGap];
        this.j = this.i;
    }

    exec(canvas) {
        for (; this.currentGap < this.gaps.length; this.currentGap++) {
            const gap = this.gaps[this.currentGap];
            for (; this.i < canvas.data.length; this.i++) {
                for (; this.j >= gap; this.j -= gap) {
                    if (canvas.data[this.j].v < canvas.data[this.j - gap].v) {
                        canvas.swap(this.j, this.j - gap);
                        return false;
                    }
                }
                this.j = this.i;
            }
            this.i = this.gaps[this.currentGap + 1];
        }
        return true;
    }
}

export { Shell };
