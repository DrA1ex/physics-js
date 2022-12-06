import * as Utils from "./utils.js";

function parseHexColor(color) {
    const r = parseInt(color.substring(1, 3), 16) / 255;
    const g = parseInt(color.substring(3, 5), 16) / 255;
    const b = parseInt(color.substring(5, 7), 16) / 255;

    return [r, g, b];
}

function rgbToHex(...colors) {
    return "#" + colors.map(
        v => Math.round(Math.max(0, Math.min(1, v) * 255))
            .toString(16)
            .padStart(2, '0')
    ).join("");
}

function clampHueAngle(deg) {
    if (deg > 360) {
        const cnt = Math.floor(deg / 360);
        return deg - cnt * 360;
    }

    if (deg < 0) {
        const cnt = Math.ceil(-deg / 360);
        return deg + cnt * 360;
    }

    return deg;
}

/**
 * @param {string} color
 * @param {number} factor
 * @return {string}
 */
export function shadeColor(color, factor) {
    let [r, g, b] = parseHexColor(color);
    return rgbToHex(r * (1 + factor), g * (1 + factor), b * (1 + factor));
}

/**
 * @param {string} color
 * @return {{h: number, s: number, l: number}}
 */
export function rgbToHsl(color) {
    const [r, g, b] = parseHexColor(color)

    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const minMaxSum = min + max;

    const lightness = minMaxSum / 2;
    const saturation = lightness > 0 && lightness < 1 ? (max - min) / (1 - Math.abs(minMaxSum - 1)) : 0;
    let hue = Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI);
    hue = clampHueAngle(hue);

    return {h: hue, l: lightness, s: saturation};
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @return {string}
 */
export function hslToRgb(h, s, l) {
    h = clampHueAngle(h);

    const C = (1 - Math.abs(2 * l - 1)) * s;
    const hPrime = h / 60;
    const X = C * (1 - Math.abs(hPrime % 2 - 1));
    const m = l - C / 2;

    let result;
    const withLight = (r, g, b) => [r + m, g + m, b + m];
    if (hPrime <= 1) result = withLight(C, X, 0);
    else if (hPrime <= 2) result = withLight(X, C, 0);
    else if (hPrime <= 3) result = withLight(0, C, X);
    else if (hPrime <= 4) result = withLight(0, X, C);
    else if (hPrime <= 5) result = withLight(X, 0, C);
    else result = withLight(C, 0, X);

    return rgbToHex(...result);
}

/**
 * @param {string} color1
 * @param {string} color2
 * @param {number} factor
 * @return {string}
 */
export function colorBetween(color1, color2, factor) {
    const rgb1 = parseHexColor(color1);
    const rgb2 = parseHexColor(color2);
    const out = new Array(3);

    let i = 0;
    for (const [c1, c2] of Utils.zip(rgb1, rgb2)) {
        out[i++] = c1 - (c1 - c2) * factor;
    }

    return rgbToHex(...out);
}