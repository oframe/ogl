import * as Vec2Func from './functions/Vec2Func.js';

export class Vec2 extends Float32Array {
    constructor(array = [0, 0]) {
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

    copy(vec2) {
        Vec2Func.copy(this, vec2);
        return this;
    }

    add(vec2) {
        Vec2Func.add(this, this, vec2);
        return this;
    }

    distance(vec2) {
        if (vec2) return Vec2Func.distance(this, vec2);
        else return Vec2Func.length(this);
    }

    squaredDistance(vec2) {
        if (vec2) return Vec2Func.squaredDistance(this, vec2);
        else return Vec2Func.squaredLength(this);
    }

    squaredLength() {
        return this.squaredDistance();
    }

    subtract(vec2) {
        Vec2Func.subtract(this, this, vec2);
        return this;
    }

    negate(vec2 = this) {
        Vec2Func.negate(this, vec2);
        return this;
    }

    cross(vec2a, vec2b) {
        Vec2Func.cross(this, vec2a, vec2b);
        return this;
    }

    scale(v) {
        Vec2Func.scale(this, this, v);
        return this;
    }

    normalize() {
        Vec2Func.normalize(this, this);
    }

    dot(vec2) {
        return Vec2Func.dot(this, vec2);
    }

    equals(vec2) {
        return Vec2Func.exactEquals(this, vec2);
    }

    applyMatrix3(mat3) {
        Vec2Func.transformMat3(this, this, mat3);
        return this;
    }

    applyMatrix4(mat4) {
        Vec2Func.transformMat4(this, this, mat4);
        return this;
    }

    lerp(vec2, v) {
        Vec2Func.lerp(this, this, vec2, v);
    }

    clone() {
        return new Vec2(this);
    }
}
