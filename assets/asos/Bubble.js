class Bubble {
    constructor() {
        this.reset();
    }

    exec(canvas) {
        if (this.j >= canvas.data.length - 1) {
            this.i++;
            this.j = 0;
        }
        if (this.i >= canvas.data.length - 1) {
            return true;
        }
        if (canvas.data[this.j].v > canvas.data[this.j + 1].v) {
            canvas.swap(this.j, this.j + 1);
        }
        this.j++;
        return false;
    }

    reset() {
        this.i = 0;
        this.j = 0;
    }
}

export { Bubble };
