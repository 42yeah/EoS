import { Model } from "./Model.js";
import { Vec2 } from "./Vec2.js";
import { OutputTile } from "./OutputTile.js";


class WFC {
    constructor(model) {
        this.model = model;
        this.wave = null;
    }

    generate(outputSize) {
        this.wave = [];
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

    observe() {

    }

    propagate() {

    }

    findOptimalTile() {
        for (let y = 0; y < outputSize.y; y++) {
            for (let x = 0; x < outputSize.x; x++) {
                
            }
        }
    }
}

export { WFC };
