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
        } else if (peaks.length === 0 || lastValue.x - lastPeak.x > tolerance) {
            lastPeak = lastValue.copy().mul(factor);
            peaks.push(lastPeak);
            ascending = false;
        }
    }

    return peaks;
}

export function generateMountainPoints(worldBox, yOffset, height, count, fn, border = 20) {
    const seed = Math.floor(Math.random() * count);
    const xStep = (worldBox.width + border * 2) / count;

    const points = new Array(count);
    let x = -border;
    for (let i = 0; i < points.length; i++) {
        const y = height * fn(seed + i);
        points[i] = new Vector2(x, yOffset + y);

        x += xStep;
    }

    return [
        new Vector2(worldBox.left, worldBox.height),
        ...points,
        new Vector2(worldBox.right, worldBox.height),
    ];
}

export function generateTreePoints(xOffset, yOffset, height, base, count) {
    const width = height / 3;
    const xStep = width * 3 / 5;
    const result = new Array(5 * count);

    let xCurrent = xOffset - (width + xStep * (count - 1)) / 2;
    for (let i = 0; i < count; i++) {
        const treeHeight = height * (2 + Math.random()) / 3;
        const y = yOffset + base / 2;

        result[i * 5] = new Vector2(xCurrent, y + base);
        result[i * 5 + 1] = new Vector2(xCurrent, y);
        result[i * 5 + 2] = new Vector2(xCurrent + width / 2, y - treeHeight);
        result[i * 5 + 3] = new Vector2(xCurrent + width, y);
        result[i * 5 + 4] = new Vector2(xCurrent + width, y + base);

        xCurrent += xStep + Math.random() * width * 2 / 5;
    }

    return result;
}

export function getCssVariable(name) {
    return window.getComputedStyle(document.body).getPropertyValue(name).trim();
}

export function setCssVariable(name, value) {
    document.body.style.setProperty(name, value);
}