import * as Vec4Func from './functions/Vec4Func.js';

export class Vec4 extends Array {
    constructor(x = 0, y = x, z = x, w = x) {
        super(x, y, z, w);
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

    normalize() {
        Vec4Func.normalize(this, this);
        return this;
    }

    fromArray(a, o = 0) {
		this[0] = a[o];
		this[1] = a[o + 1];
		this[2] = a[o + 2];
		this[3] = a[o + 3];
		return this;
	}
}
