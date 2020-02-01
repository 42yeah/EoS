class Quick {
    constructor() {
        this.reset();
    }

    reset() {
        this.stack = [];
        this.started = false;
    }

    exec(canvas) {
        if (this.stack.length == 0 && !this.started) {
            this.stack.push({
                lo: 0,
                hi: canvas.data.length - 1
            });
        } else if (this.stack.length == 0) {
            return true;
        }
        let s = this.stack.splice(0, 1)[0];
        this.quicksort(canvas, s.lo, s.hi);
        return false;
    }

    quicksort(canvas, lo, hi) {
        if (lo < hi) {
            let p = this.partition(canvas, lo, hi);
            this.stack.push({
                lo: lo,
                hi: p - 1
            });
            this.stack.push({
                lo: p + 1,
                hi: hi
            });
        }
    }

    partition(canvas, lo, hi) {
        const pivot = canvas.data[hi].v;
        let i = lo;
        for (let j = lo; j <= hi; j++) {
            if (canvas.data[j].v < pivot) {
                canvas.swap(i, j);
                i++;
            }
        }
        if (canvas.data[i].v != canvas.data[hi].v) {
            canvas.swap(i, hi);
        }
        
        return i;
    }
}

export { Quick };
