import { Vec2 } from "./Vec2.js";


class Perlin {
    constructor(seedA, seedB) {
        this.seedA = seedA;
        this.seedB = seedB;
    }

    at(pos) {
        const u = pos.floor();
        const f = pos.fract();
        const s = new Vec2(this.smoothstep(0.0, 1.0, f.x), this.smoothstep(0.0, 1.0, f.y));
        const a = u.hash(this.seedA, this.seedB);
        const b = u.add(new Vec2(1, 0)).hash(this.seedA, this.seedB);
        const c = u.add(new Vec2(0, 1)).hash(this.seedA, this.seedB);
        const d = u.add(new Vec2(1, 1)).hash(this.seedA, this.seedB);
        return this.mix(this.mix(a.dot(f), b.dot(f.add(new Vec2(-1.0, 0))), s.x),
            this.mix(c.dot(f.add(new Vec2(0, -1.0))), d.dot(f.add(new Vec2(-1.0, -1.0))), s.x), s.y);
    }

    mix(a, b, v) {
        return (1.0 - v) * a + v * b;
    }

    smoothstep(lo, hi, v) {
        return this.mix(lo, hi, 3.0 * v * v - 2.0 * v * v * v);
    }
}

export { Perlin };
