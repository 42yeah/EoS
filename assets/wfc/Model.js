import { Vec2 } from "./Vec2.js";
import { Pattern } from "./Pattern.js";


class Model {
    constructor(map, N) {
        this.rawMap = map;
        if (map.length <= 0) { return; }
        this.mapSize = new Vec2(map[0].length, map.length);
        this.N = N; // pattern size
        this.patterns = [];
    }

    processPatterns() {
        this.patterns = [];
        // Generate patterns
        for (let y = 0; y < this.mapSize.y - this.N + 1; y++) {
            for (let x = 0; x < this.mapSize.x - this.N + 1; x++) {
                this.patterns.push(new Pattern(this.N, this, new Vec2(x, y), "0"));
                this.patterns.push(new Pattern(this.N, this, new Vec2(x, y), "90"));
                this.patterns.push(new Pattern(this.N, this, new Vec2(x, y), "180"));
                this.patterns.push(new Pattern(this.N, this, new Vec2(x, y), "270"));
            }
        }
        // Delete repetitive patterns
        for (let i = 0; i < this.patterns.length; i++) {
            for (let j = i + 1; j < this.patterns.length; j++) {
                if (this.patterns[i].equals(this.patterns[j])) {
                    this.patterns[i].frequency++;
                    this.patterns.splice(j, 1);
                    j--;
                    continue;
                }
            }
        }
        // Process overlap rules
        for (let i = 0; i < this.patterns.length; i++) {
            const pattern = this.patterns[i];
            for (let y = -this.N + 1; y < this.N; y++) {
                for (let x = -this.N + 1; x < this.N; x++) {
                    const rule = {
                        offset: new Vec2(x, y),
                        agrees: []
                    };
                    for (let j = 0; j < this.patterns.length; j++) {
                        if (pattern.agrees(this.patterns[j], rule.offset)) {
                            rule.agrees.push(this.patterns[j]);
                        }
                    }
                    pattern.overlapRules.push(rule);
                }
            }
        }
        console.log(this);
    }

    at(pos) {
        if (!pos.boundaryCheck(this.mapSize)) { return null; }
        return this.rawMap[pos.y][pos.x];
    }
}

export { Model };
