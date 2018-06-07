import * as Vec3Func from './functions/Vec3Func.js';

export class Vec3 extends Float32Array {
    constructor(array = [0, 0, 0]) {
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

    add(v) {
        Vec3Func.add(this, this, v);
        return this;
    }

    multiply(m) {
        if (m.length) Vec3Func.multiply(this, this, m);
        else Vec3Func.scale(this, this, m);
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

    subtract(va, vb) {
        if (vb) Vec3Func.subtract(this, va, vb);
        else Vec3Func.subtract(this, this, va);
        return this;
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

    angle(v) {
        return Vec3Func.angle(this, v);
    }

    clone() {
        return new Vec3(this);
    }
}
