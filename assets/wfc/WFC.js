import { Model } from "./Model.js";
import { Vec2 } from "./Vec2.js";
import { OutputTile } from "./OutputTile.js";


class WFC {
    constructor(model) {
        this.model = model;
        this.wave = null;
        this.updates = [];
    }

    generate(outputSize) {
        this.wave = [];
        this.updates = [];
        this.outputSize = outputSize;
        for (let y = 0; y < outputSize.y; y++) {
            const row = [];
            for (let x = 0; x < outputSize.x; x++) {
                const patterns = [];
                for (let i = 0; i < this.model.patterns.length; i++) {
                    patterns.push(this.model.patterns[i]);
                }
                row.push(new OutputTile(patterns));
            }
            this.wave.push(row);
        }

        while (true) {
            const res = this.observe();
            if (res == 1 || res == -1) { break; }
            this.propagate();
        }
    }

    init(outputSize) {
        this.wave = [];
        this.updates = [];
        this.outputSize = outputSize;
        for (let y = 0; y < outputSize.y; y++) {
            const row = [];
            for (let x = 0; x < outputSize.x; x++) {
                const patterns = [];
                for (let i = 0; i < this.model.patterns.length; i++) {
                    patterns.push(this.model.patterns[i]);
                }
                row.push(new OutputTile(patterns));
            }
            this.wave.push(row);
        }
    }

    step() {
        const res = this.observe();
        this.propagate();
        return res;
    }

    observe() {
        const optimals = this.findOptimalTiles();
        if (optimals.length <= 0) {
            return 1; // DONE
        } else if (this.at(optimals[0]).isContradictive()) {
            return -1; // CONTRADICTION
        }
        // Otherwise, just grab whatever one
        let index = Math.floor(Math.random() * optimals.length);
        const pos = optimals[index];
        this.at(pos).collapse();
        for (let y = -this.model.N + 1; y < this.model.N; y++) {
            for (let x = -this.model.N + 1; x < this.model.N; x++) {
                const offset = pos.add(new Vec2(x, y));
                if (!offset.boundaryCheck(this.outputSize) || this.at(offset).isDefinite() || this.at(offset).isContradictive()) {
                    continue;
                }
                this.updates.push(offset);
            }
        }
        return 0; // FINE
    }

    propagate() {
        let stack = 0;
        while (this.updates.length > 0) {
            const pos = this.updates.splice(0, 1)[0];
            const tile = this.at(pos);
            
            let dirty = false;
            // For every pattern in that tile
            for (let i = 0; i < tile.patterns.length; i++) {
                const pattern = tile.patterns[i];
                let legit = true;
                // For every ruleset for that pattern
                // (For every available direction)
                for (let j = 0; j < pattern.overlapRules.length; j++) {
                    const rule = pattern.overlapRules[j];
                    const otherTile = this.at(pos.add(rule.offset));
                    if (otherTile && otherTile.violates(rule)) {
                        legit = false;
                        break;
                    }
                }
                if (!legit) {
                    tile.patterns.splice(i, 1);
                    dirty = true;
                    i--;
                }
            }
            if (dirty) {
                for (let y = -this.model.N + 1; y < this.model.N; y++) {
                    for (let x = -this.model.N + 1; x < this.model.N; x++) {
                        const offset = pos.add(new Vec2(x, y));
                        if (!offset.boundaryCheck(this.outputSize) || this.at(offset).isDefinite() || this.at(offset).isContradictive()) {
                            continue;
                        }
                        this.updates.push(offset);
                    }
                }
            }
        }
    }

    findOptimalTiles() {
        let lo = -1;
        let tiles = [];
        for (let y = 0; y < this.outputSize.y; y++) {
            for (let x = 0; x < this.outputSize.x; x++) {
                const pos = new Vec2(x, y);
                const tile = this.at(pos);
                const entropy = tile.getEntropy();
                if (tile.isDefinite()) { continue; }
                if (lo == -1 || entropy < lo) {
                    lo = entropy;
                    tiles = [];
                }
                if (entropy == lo) {
                    tiles.push(pos);
                }
            }
        }
        return tiles;
    }

    at(pos) {
        if (!pos.boundaryCheck(this.outputSize)) { return null; }
        return this.wave[pos.y][pos.x];
    }

    render(tw, th, ctx) {
        for (let y = 0; y < this.outputSize.y; y++) {
            for (let x = 0; x < this.outputSize.x; x++) {
                const tile = this.at(new Vec2(x, y));
                const color = tile.getColor();
                ctx.fillStyle = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
                ctx.fillRect(x * tw, y * th, tw, th);
            }
        }
    }
}

export { WFC };
