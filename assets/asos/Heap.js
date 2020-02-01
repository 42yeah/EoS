class Heap {
    constructor() {
        this.reset();
    }

    reset() {
        this.start = null;
        this.end = null;
    }

    exec(canvas) {
        if (this.start == null) {
            this.start = this.parent(canvas.data.length - 1);
            return false;
        }
        if (this.start >= 0) {
            this.siftDown(canvas, this.start, canvas.data.length);
            this.start = this.start - 1;
            return false;
        } else if (this.end == null) {
            this.end = canvas.data.length - 1;
            return false;
        } else if (this.end > 0) {
            canvas.swap(this.end, 0);
            this.end = this.end - 1;
            this.siftDown(canvas, 0, this.end);
            return false;
        }
        return true;
    }

    parent(i) {
        return Math.floor((i - 1) / 2);
    }

    leftChild(i) {
        return i * 2 + 1;
    }

    rightChild(i) {
        return i * 2 + 2;
    }

    siftDown(canvas, i, end) {
        let root = i;
        while (this.leftChild(root) < end) { // While this root still get child
            const left = this.leftChild(root);
            const right = this.rightChild(root);
            let selection = left;
            if (right < end) {
                selection = canvas.data[left].v > canvas.data[right].v ? left : right;
            }
            if (canvas.data[root].v < canvas.data[selection].v) {
                canvas.swap(root, selection);
                root = selection;
            } else {
                return;
            }
        }
    }
}

export { Heap };
