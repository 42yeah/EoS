class Bogo {
    constructor() {
        this.reset();
    }

    reset() {

    }

    exec(canvas) {
        if (this.isSorted(canvas)) {
            return true;
        } else {
            let a = Math.floor(Math.random() * canvas.data.length);
            let b = Math.floor(Math.random() * canvas.data.length);
            canvas.swap(a, b);
        }
    }

    isSorted(canvas) {
        for (let i = 0; i < canvas.data.length - 1; i++) {
            if (canvas.data[i].v > canvas.data[i + 1].v) {
                return false;
            }
        }
        return true;
    }
}

export { Bogo };
