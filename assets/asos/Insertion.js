class Insertion {
    constructor() {
        this.reset();
    }

    reset() {
        this.i = 0;
    }

    exec(canvas) {
        if (this.i >= canvas.data.length) {
            return true;
        }
        let minI = this.i;
        let min = canvas.data[this.i].v;
        for (let j = this.i; j < canvas.data.length; j++) {
            if (canvas.data[j].v < min) {
                min = canvas.data[j].v;
                minI = j;
            }
        }
        canvas.swap(this.i, minI);
        this.i++;
    }
}

export { Insertion };
