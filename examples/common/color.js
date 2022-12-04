export function shadeColor(color, factor) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(Math.floor(R * (1 + factor)), 255);
    G = Math.min(Math.floor(G * (1 + factor)), 255);
    B = Math.min(Math.floor(B * (1 + factor)), 255);

    let RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    let GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    let BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return `#${RR}${GG}${BB}`;
}