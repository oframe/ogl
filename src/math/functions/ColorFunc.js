const NAMES	= {
    "black" : "#000000",
    "white" : "#ffffff",
    "red" : "#ff0000",
    "green" : "#00ff00",
    "blue" : "#0000ff",
    "fuchsia" : "#ff00ff",
    "cyan" : "#00ffff",
    "yellow" : "#ffff00",
    "orange" : "#ff8000",
};

export function hexToRGB(hex) {
    if (hex.length === 4) hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!rgb) console.warn(`Unable to convert hex string ${hex} to rgb values`);
    return [
        parseInt(rgb[1], 16) / 255,
        parseInt(rgb[2], 16) / 255,
        parseInt(rgb[3], 16) / 255
    ];
}

export function numberToRGB(num) {
    num = parseInt(num);
    return [
        (num >> 16 & 255) / 255,
        (num >> 8 & 255) / 255,
        (num & 255) / 255,
    ]
}

export function parseColor(color) {
    
    // Empty
    if (color === undefined) return [0, 0, 0];

    // Decimal
    if (arguments.length === 3) return arguments;

    // Number
    if (!isNaN(color)) return numberToRGB(color);
        
    // Hex
    if (color[0] === "#") return hexToRGB(color);

    // Names
    if (NAMES[color.toLowerCase()]) return hexToRGB(NAMES[color.toLowerCase()]);

    console.warn('Color format not recognised');
    return [0, 0, 0];
}

