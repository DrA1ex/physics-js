/**
 * @param {Vector2[]} data
 * @param {boolean} [invert=false]
 * @param {number} [tolerance=10]
 * @return {Vector2[]}
 */
import {Vector2} from "../../lib/utils/vector.js";

export function findPeaks(data, invert = false, tolerance = 10) {
    const peaks = [];
    let lastValue = data[0];
    let lastPeak = null;
    let ascending = false;

    const factor = new Vector2(1, invert ? -1 : 1);

    for (let i = 1; i < data.length; i++) {
        const item = data[i].copy().mul(factor);

        if (item.y >= lastValue.y) {
            lastValue = item;
            ascending = true
        } else if (!ascending) {
            lastValue = item
        } else if (peaks.length === 0 || lastValue.x - lastPeak.x > 10) {
            lastPeak = lastValue.copy().mul(factor);
            peaks.push(lastPeak);
            ascending = false;
        }
    }

    return peaks;
}