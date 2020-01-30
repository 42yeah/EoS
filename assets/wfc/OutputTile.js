import { Pattern } from "./Pattern.js";
import { Vec2 } from "./Vec2.js";


class OutputTile {
    constructor(patterns) {
        this.patterns = patterns;
    }

    getEntropy() {
        let sum = 0;
        for (let i = 0; i < this.patterns.length; i++) {
            sum += this.patterns[i].frequency;
        }
        return sum;
    }

    isDefinite() {
        return this.patterns.length == 1;
    }

    isContradictive() {
        return this.patterns.length == 0;
    }

    /**
     * Collapse all except one based on weights.
     */
    collapse() {
        let e = Math.random() * this.getEntropy();
        let i;
        for (i = 0; i < this.patterns.length; i++) {
            e -= this.patterns[i].frequency;
            if (e <= 0) {
                break;
            }
        }
        this.patterns.splice(0, i);
        this.patterns.splice(1, this.patterns.length - 1);
    }

    violates(rule) {
        for (let i = 0; i < rule.agrees.length; i++) {
            const pattern = rule.agrees[i];
            for (let j = 0; j < this.patterns.length; j++) {
                if (pattern == this.patterns[j]) {
                    // Does not violate!
                    return false;
                }
            }
        }
        return true;
    }

    getColor() {
        if (this.isContradictive()) {
            return {
                r: 255,
                g: 255,
                b: 255
            };
        }
        const zero = new Vec2(0, 0);
        if (this.isDefinite()) {
            return {
                r: this.patterns[0].at(zero)[0],
                g: this.patterns[0].at(zero)[1],
                b: this.patterns[0].at(zero)[2],
            }
        }
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < this.patterns.length; i++) {
            r += this.patterns[i].at(zero)[0];
            g += this.patterns[i].at(zero)[1];
            b += this.patterns[i].at(zero)[2];
        }
        r /= this.patterns.length;
        g /= this.patterns.length;
        b /= this.patterns.length;
        r = Math.floor(r);
        g = Math.floor(g);
        b = Math.floor(b);
        return {
            r, g, b
        };
    }
}

export { OutputTile };
