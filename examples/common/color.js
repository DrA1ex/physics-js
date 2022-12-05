function parseHexColor(color) {
    const r = parseInt(color.substring(1, 3), 16) / 255;
    const g = parseInt(color.substring(3, 5), 16) / 255;
    const b = parseInt(color.substring(5, 7), 16) / 255;

    return [r, g, b];
}

export function shadeColor(color, factor) {
    let [r, g, b] = parseHexColor(color);
    return rgbToHex(r * (1 + factor), g * (1 + factor), b * (1 + factor));
}

export function rgbToHsl(color) {
    const [r, g, b] = parseHexColor(color)

    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const minMaxSum = min + max;

    const lightness = minMaxSum / 2;
    const saturation = lightness > 0 && lightness < 1 ? (max - min) / (1 - Math.abs(minMaxSum - 1)) : 0;
    let hue = Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI);
    if (hue < 0) hue += 360;

    return {h: hue, l: lightness, s: saturation};
}

export function hslToRgb(h, s, l) {
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

export function rgbToHex(...colors) {
    return "#" + colors.map(
        v => Math.round(Math.max(0, Math.min(1, v) * 255))
            .toString(16)
            .padStart(2, '0')
    ).join("");
}