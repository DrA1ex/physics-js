const AngleParseRegex = /^([+-]?(\d*\.)?\d+)(deg|rad|grad|turn)$/

export function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

export function formatUnit(value, unit, unitsConfig, fractionDigits = 2) {
    const fraction = Math.pow(10, fractionDigits);
    value = Math.round(value * fraction) / fraction;

    let sizeUnit = "";
    for (let i = 0; i < unitsConfig.length; i++) {
        if (value >= unitsConfig[i].exp) {
            value /= unitsConfig[i].exp;
            sizeUnit = unitsConfig[i].unit;
            break;
        }
    }

    return `${Number(value.toFixed(fractionDigits))} ${sizeUnit}${unit}`;
}


export function formatStandardUnit(value, unit, fractionDigits = 2, exp = 1000) {
    const units = [
        {unit: "P", exp: Math.pow(exp, 5)},
        {unit: "T", exp: Math.pow(exp, 4)},
        {unit: "G", exp: Math.pow(exp, 3)},
        {unit: "M", exp: Math.pow(exp, 2)},
        {unit: "K", exp: exp},
        {unit: "", exp: 1},
        {unit: "m", exp: Math.pow(exp, -1)},
        {unit: "u", exp: Math.pow(exp, -2)},
        {unit: "n", exp: Math.pow(exp, -3)},
    ]

    return formatUnit(value, unit, units, fractionDigits);
}

/**
 * @param {number} value
 * @param {number} period
 * @return {number}
 */
export function clampPeriodic(value, period) {
    if (value > period) {
        const cnt = Math.floor(value / period);
        return value - cnt * period;
    }

    if (value < 0) {
        const cnt = Math.ceil(-value / period);
        return value + cnt * period;
    }

    return value;
}

/**
 * @template T1, T2
 *
 * @param {Array} array1
 * @param {Array} array2
 *
 * @generator
 * @yield {[T1, T2]}
 */
export function* zip(array1, array2) {
    const size = Math.max(array1.length, array2.length);

    for (let i = 0; i < size; i++) {
        const item1 = i < array1.length ? array1[i] : null
        const item2 = i < array2.length ? array2[i] : null

        yield [item1, item2];
    }
}

/**
 * @param {string} angle
 * @return {[number, string]}
 */
export function parseAngle(angle) {
    if (typeof angle !== "string") throw new Error(`Invalid argument: expected string, got ${typeof angle}`);

    const match = angle.match(AngleParseRegex);
    if (!match) throw new Error(`Unable to parse angle string: \"${angle}\"`);

    const value = Number.parseFloat(match[1]);
    const unit = match[3];

    let converted;
    switch (unit) {
        case "deg":
            converted = value / 180 * Math.PI;
            break;

        case "grad":
            converted = value / 200 * Math.PI;
            break;

        case "turn":
            converted = value * 2 * Math.PI;
            break;

        default:
            converted = value;
            break;
    }

    return [converted, unit];
}

export function formatAngle(radians, unit) {
    let converted;
    switch (unit) {
        case "deg":
            converted = radians / Math.PI * 180;
            break;

        case "grad":
            converted = radians / Math.PI * 200;
            break;

        case "turn":
            converted = radians / Math.PI / 2;
            break;

        case "rad":
            converted = radians;
            break;

        default:
            throw new Error(`Unsupported unit: \"${unit}\"`);
    }

    return `${converted}${unit}`;
}