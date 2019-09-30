export function hexToRGB(hex) {
    if (hex.length === 4) hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) console.warn(`Unable to convert hex string ${hex} to rgb values`);
    return [
        parseInt(r[1], 16) / 255,
        parseInt(r[2], 16) / 255,
        parseInt(r[3], 16) / 255
    ];
}