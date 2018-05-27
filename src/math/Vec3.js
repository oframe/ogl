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

    set(x, y, z) {
        Vec3Func.set(this, x, y, z);
        return this;
    }

    copy(vec3) {
        Vec3Func.copy(this, vec3);
        return this;
    }

    add(vec3) {
        Vec3Func.add(this, this, vec3);
        return this;
    }

    distance(vec3) {
        if (vec3) return Vec3Func.distance(this, vec3);
        else return Vec3Func.length(this);
    }

    squaredDistance(vec3) {
        if (vec3) return Vec3Func.squaredDistance(this, vec3);
        else return Vec3Func.squaredLength(this);
    }

    squaredLength() {
        return this.squaredDistance();
    }

    subtract(vec3) {
        Vec3Func.subtract(this, this, vec3);
        return this;
    }

    negate(vec3 = this) {
        Vec3Func.negate(this, vec3);
        return this;
    }

    cross(vec3a, vec3b) {
        Vec3Func.cross(this, vec3a, vec3b);
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

    dot(vec3) {
        return Vec3Func.dot(this, vec3);
    }

    equals(vec3) {
        return Vec3Func.exactEquals(this, vec3);
    }

    applyMatrix4(mat4) {
        Vec3Func.transformMat4(this, this, mat4);
        return this;
    }

    angle(vec3) {
        return Vec3Func.angle(this, vec3);
    }

    clone() {
        return new Vec3(this);
    }
}
