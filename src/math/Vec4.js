import * as Vec4Func from './functions/Vec4Func.js';

export class Vec4 extends Float32Array {
    constructor(array = [0, 0, 0, 0]) {
        if (!array.length) array = [array, array, array];
        super(array);
        return this;
    }

    get x() {
        return this[0];
    }

    set x(v) {
        this[0] = v;
    }

    get y() {
        return this[1];
    }

    set y(v) {
        this[1] = v;
    }

    get z() {
        return this[2];
    }

    set z(v) {
        this[2] = v;
    }

    get w() {
        return this[3];
    }

    set w(v) {
        this[3] = v;
    }

    set(x, y, z, w) {
        Vec4Func.set(this, x, y, z, w);
        return this;
    }
}
