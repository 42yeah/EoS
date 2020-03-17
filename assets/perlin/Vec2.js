class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vec2) {
        return new Vec2(this.x + vec2.x, this.y + vec2.y);
    }

    divide(vec2) {
        return new Vec2(this.x / vec2.x, this.y / vec2.y);
    }

    multiply(vec2) {
        return new Vec2(this.x * vec2.x, this.y * vec2.y);
    }

    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    fract() {
        const floored = this.floor();
        return new Vec2(this.x - floored.x, this.y - floored.y);
    }

    hash(seedA, seedB) {
        return new Vec2(
            Math.sin(this.dot(seedA)),
            Math.sin(this.dot(seedB))
        ).multiply(new Vec2(10000000, 10000000)).fract().multiply(new Vec2(2, 2)).add(new Vec2(-1, -1));
    }

    dot(vec2) {
        return this.x * vec2.x + this.y * vec2.y;
    }

    boundaryCheck(size) {
        return !(this.x < 0 || this.x >= size.x || this.y < 0 || this.y >= size.y);
    }
}

export { Vec2 };
