import * as Vec3Func from './functions/Vec3Func.js';

export class Vec3 extends Float32Array {
    constructor(array = [0, 0, 0]) {
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

    set(x, y = x, z = x) {
        Vec3Func.set(this, x, y, z);
        return this;
    }

    copy(v) {
        Vec3Func.copy(this, v);
        return this;
    }

    add(va, vb) {
        if (vb) Vec3Func.add(this, va, vb);
        else Vec3Func.add(this, this, va);
        return this;
    }

    sub(va, vb) {
        if (vb) Vec3Func.subtract(this, va, vb);
        else Vec3Func.subtract(this, this, va);
        return this;
    }

    multiply(v) {
        if (v.length) Vec3Func.multiply(this, this, v);
        else Vec3Func.scale(this, this, v);
        return this;
    }

    divide(v) {
        if (v.length) Vec3Func.divide(this, this, v);
        else Vec3Func.scale(this, this, 1 / v);
        return this;
    }

    inverse(v = this) {
        Vec3Func.inverse(this, v);
        return this;
    }

    length() {
        return Vec3Func.length(this);
    }

    distance(v) {
        return Vec3Func.distance(this, v);
    }

    squaredDistance(v) {
        if (v) return Vec3Func.squaredDistance(this, v);
        else return Vec3Func.squaredLength(this);
    }

    squaredLength() {
        return this.squaredDistance();
    }

    negate(v = this) {
        Vec3Func.negate(this, v);
        return this;
    }

    cross(va, vb) {
        Vec3Func.cross(this, va, vb);
        return this;
    }

    scale(v) {
        Vec3Func.scale(this, this, v);
        return this;
    }

    normalize() {
        Vec3Func.normalize(this, this);
        return this;
    }

    dot(v) {
        return Vec3Func.dot(this, v);
    }

    equals(v) {
        return Vec3Func.exactEquals(this, v);
    }

    applyMatrix4(mat4) {
        Vec3Func.transformMat4(this, this, mat4);
        return this;
    }

    applyQuaternion(q) {
        Vec3Func.transformQuat(this, this, q);
        return this;
    }

    angle(v) {
        return Vec3Func.angle(this, v);
    }

    lerp(v, t) {
        Vec3Func.lerp(this, this, v, t);
        return this;
    }

    clone() {
        return new Vec3(this);
    }

    fromArray(a, o = 0) {
		this[0] = a[o];
		this[1] = a[o + 1];
		this[2] = a[o + 2];
		return this;
	}
}
