import * as Vec2Func from './functions/Vec2Func.js';

export class Vec2 extends Float32Array {
    constructor(array = [0, 0]) {
        if (!array.length) array = [array, array];
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

    set(x, y = x) {
        Vec2Func.set(this, x, y);
        return this;
    }

    copy(v) {
        Vec2Func.copy(this, v);
        return this;
    }

    add(v) {
        Vec2Func.add(this, this, v);
        return this;
    }

    multiply(m) {
        if (m.length) Vec2Func.multiply(this, this, m);
        else Vec2Func.scale(this, this, m);
        return this;
    }

    distance(v) {
        if (v) return Vec2Func.distance(this, v);
        else return Vec2Func.length(this);
    }

    squaredDistance(v) {
        if (v) return Vec2Func.squaredDistance(this, v);
        else return Vec2Func.squaredLength(this);
    }

    squaredLength() {
        return this.squaredDistance();
    }

    subtract(va, vb) {
        if (vb) Vec2Func.subtract(this, va, vb);
        else Vec2Func.subtract(this, this, va);
        return this;
    }

    negate(v = this) {
        Vec2Func.negate(this, v);
        return this;
    }

    cross(va, vb) {
        Vec2Func.cross(this, va, vb);
        return this;
    }

    scale(v) {
        Vec2Func.scale(this, this, v);
        return this;
    }

    normalize() {
        Vec2Func.normalize(this, this);
    }

    dot(v) {
        return Vec2Func.dot(this, v);
    }

    equals(v) {
        return Vec2Func.exactEquals(this, v);
    }

    applyMatrix3(mat3) {
        Vec2Func.transformMat3(this, this, mat3);
        return this;
    }

    applyMatrix4(mat4) {
        Vec2Func.transformMat4(this, this, mat4);
        return this;
    }

    lerp(v, a) {
        Vec2Func.lerp(this, this, v, a);
    }

    clone() {
        return new Vec2(this);
    }

    fromArray(a, o = 0) {
		this[0] = a[o];
		this[1] = a[o + 1];
		return this;
	}
}
