import { Pattern } from "./Pattern.js";


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
}

export { OutputTile };
