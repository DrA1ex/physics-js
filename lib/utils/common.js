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