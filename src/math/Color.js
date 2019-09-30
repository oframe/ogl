// TODO : support more color formats - e.g 0xffffff
import * as ColorFunc from './functions/ColorFunc.js';

export class Color extends Array {
    constructor(r = 0, g = 0, b = 0) {
        if (typeof r === 'string') [r, g, b] = ColorFunc.hexToRGB(r);
        super(r, g, b);
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
        if (typeof r === 'string') [r, g, b] = ColorFunc.hexToRGB(r);
        if (r.length) return this.copy(r);
        this[0] = r;
        this[1] = g;
        this[2] = b;
        return this;
    }

    copy(v) {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        return this;
    }
}