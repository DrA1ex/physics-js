import {NumericAnimation} from "./numeric.js";

export class PercentAnimation extends NumericAnimation {
    /**
     * @param {string} from
     * @param {string} to
     * @param {number} step
     */
    constructor(from, to, step) {
        const begin = Number.parseFloat(from);
        const end = Number.parseFloat(to);

        super(begin, end, step);
    }

    next(delta) {
        return `${super.next(delta)}%`;
    }
}