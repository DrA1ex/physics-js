export function assignColor(buffer, index, count, rgb, alpha) {
    index *= 4;
    for (let i = 0; i < count; i++) {
        for (let k = 0; k < 3; k++) {
            buffer[index + i * 4 + k] = rgb[k];
        }

        buffer[index + i * 4 + 3] = alpha;
    }
}

export function setIndexedTriangle(buffer, index, pIndex, count) {
    index *= 3;
    for (let k = 0; k < count; k++) {
        buffer[index + k * 3] = pIndex;
        buffer[index + k * 3 + 1] = pIndex + k % count + 1;
        buffer[index + k * 3 + 2] = pIndex + (k + 1) % count + 1;
    }
}
