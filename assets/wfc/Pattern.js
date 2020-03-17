import { Vec2 } from "./Vec2.js";


class Pattern {
    constructor(N, model, basePos, t) {
        this.rawPattern = [];
        this.N = N;
        this.size = new Vec2(N, N);
        this.frequency = 1;
        this.rot = 0;
        this.overlapRules = [];
        switch (t) {
            case "90":
                this.rot = 90;
                break;

            case "180":
                this.rot = 180;
                break;

            case "270":
                this.rot = 270;
                break;
        }
        const size = new Vec2(N, N);
        for (let y = 0; y < this.N; y++) {
            const row = [];
            for (let x = 0; x < this.N; x++) {
                row.push(model.at(basePos.add(new Vec2(x, y).rot(this.rot, size))));
            }
            this.rawPattern.push(row);
        }
    }

    equals(pattern) {
        for (let y = 0; y < this.N; y++) {
            for (let x = 0; x < this.N; x++) {
                const pos = new Vec2(x, y);
                if (!this.subequals(pattern, pos)) {
                    return false;
                }
            }
        }
        return true;
    }

    subequals(pattern, pos) {
        const mine = this.at(pos);
        const theirs = pattern.at(pos);
        return mine[0] == theirs[0] && mine[1] == theirs[1] && mine[2] == theirs[2] && mine[3] == theirs[3];
    }

    at(pos) {
        if (!pos.boundaryCheck(new Vec2(this.N, this.N))) { return null; }
        return this.rawPattern[pos.y][pos.x];
    }

    agrees(pattern, offset) {
        for (let y = 0; y < this.N; y++) {
            for (let x = 0; x < this.N; x++) {
                if (!this.subagrees(pattern, new Vec2(x, y), offset)) {
                    return false;
                }
            }
        }
        return true;
    }

    subagrees(pattern, pos, offset) {
        const pPos = new Vec2(pos.x - offset.x, pos.y - offset.y);
        const mPos = new Vec2(pos.x, pos.y);
        if (!pPos.boundaryCheck(pattern.size) || !mPos.boundaryCheck(this.size)) {
            return true;
        }
        const mine = this.at(mPos);
        const theirs = pattern.at(pPos);
        return mine[0] == theirs[0] && mine[1] == theirs[1] && mine[2] == theirs[2] && mine[3] == theirs[3];
    }
}

export { Pattern };
