class Cocktail {
    constructor() {
        this.reset();
    }

    reset() {
        this.i = 0;
        this.j = 0;
        this.direction = 1;
    }

    exec(canvas) {
        if ((this.j >= canvas.data.length - 1 && this.direction == 1) || (this.j < 1 && this.direction == -1)) {
            this.i++;
            this.direction = -this.direction;
        }
        if (this.i >= canvas.data.length - 1) {
            return true;
        }
        switch (this.direction) {
            case 1:
                if (canvas.data[this.j].v > canvas.data[this.j + 1].v) {
                    canvas.swap(this.j, this.j + 1);
                }
                break;

            case -1:
                if (canvas.data[this.j].v < canvas.data[this.j - 1].v) {
                    canvas.swap(this.j, this.j - 1);
                }
                break;
        }
        
        this.j += this.direction;
        return false;
    }
}

export { Cocktail };
