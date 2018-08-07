// TODO : support more color formats - e.g 0xffffff, '#fff'

export class Color extends Float32Array {
    constructor(array = [0, 0, 0]) {
        super(3);
        if (typeof array === 'string') array = Color.hexToRGB(array);
        this.set(...array);
        return this;
    }

    get r() {
        return this[0];
    }

    set r(v) {
        this[0] = v;
    }

    get g() {
        return this[1];
    }

    set g(v) {
        this[1] = v;
    }

    get b() {
        return this[2];
    }

    set b(v) {
        this[2] = v;
    }

    set(r, g, b) {
        this[0] = r;
        this[1] = g;
        this[2] = b;
        return this;
    }

    static hexToRGB(hex) {
        if (hex.length === 4) hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return r ? [
            parseInt(r[1], 16) / 255,
            parseInt(r[2], 16) / 255,
            parseInt(r[3], 16) / 255
        ] : null;
    }
}