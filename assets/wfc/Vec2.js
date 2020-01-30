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

    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    boundaryCheck(size) {
        return !(this.x < 0 || this.x >= size.x || this.y < 0 || this.y >= size.y);
    }

    rot(deg, size) {
        switch (deg) {
            case 90: // Flip & mirror X
                return new Vec2(size.x - this.y - 1, this.x);

            case 180: // Mirror everything
                return new Vec2(size.x - this.x - 1, size.y - this.y - 1);

            case 270: // Flip & mirror Y
                return new Vec2(this.y, size.y - this.x - 1);

            case 0:
            default:
                return new Vec2(this.x, this.y);
        }
    }
}

export { Vec2 };
