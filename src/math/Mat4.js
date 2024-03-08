import * as Mat4Func from './functions/Mat4Func.js';

export class Mat4 extends Array {
    constructor(
        m00 = 1,
        m01 = 0,
        m02 = 0,
        m03 = 0,
        m10 = 0,
        m11 = 1,
        m12 = 0,
        m13 = 0,
        m20 = 0,
        m21 = 0,
        m22 = 1,
        m23 = 0,
        m30 = 0,
        m31 = 0,
        m32 = 0,
        m33 = 1
    ) {
        super(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        return this;
    }

    get x() {
        return this[12];
    }

    get y() {
        return this[13];
    }

    get z() {
        return this[14];
    }

    get w() {
        return this[15];
    }

    set x(v) {
        this[12] = v;
    }

    set y(v) {
        this[13] = v;
    }

    set z(v) {
        this[14] = v;
    }

    set w(v) {
        this[15] = v;
    }

    set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        if (m00.length) return this.copy(m00);
        Mat4Func.set(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        return this;
    }

    translate(v, m = this) {
        Mat4Func.translate(this, m, v);
        return this;
    }

    rotate(v, axis, m = this) {
        Mat4Func.rotate(this, m, v, axis);
        return this;
    }

    scale(v, m = this) {
        Mat4Func.scale(this, m, typeof v === 'number' ? [v, v, v] : v);
        return this;
    }

    add(ma, mb) {
        if (mb) Mat4Func.add(this, ma, mb);
        else Mat4Func.add(this, this, ma);
        return this;
    }

    sub(ma, mb) {
        if (mb) Mat4Func.subtract(this, ma, mb);
        else Mat4Func.subtract(this, this, ma);
        return this;
    }

    multiply(ma, mb) {
        if (!ma.length) {
            Mat4Func.multiplyScalar(this, this, ma);
        } else if (mb) {
            Mat4Func.multiply(this, ma, mb);
        } else {
            Mat4Func.multiply(this, this, ma);
        }
        return this;
    }

    identity() {
        Mat4Func.identity(this);
        return this;
    }

    copy(m) {
        Mat4Func.copy(this, m);
        return this;
    }

    fromPerspective({ fov, aspect, near, far } = {}) {
        Mat4Func.perspective(this, fov, aspect, near, far);
        return this;
    }

    fromOrthogonal({ left, right, bottom, top, near, far }) {
        Mat4Func.ortho(this, left, right, bottom, top, near, far);
        return this;
    }

    fromQuaternion(q) {
        Mat4Func.fromQuat(this, q);
        return this;
    }

    setPosition(v) {
        this.x = v[0];
        this.y = v[1];
        this.z = v[2];
        return this;
    }

    inverse(m = this) {
        Mat4Func.invert(this, m);
        return this;
    }

    compose(q, pos, scale) {
        Mat4Func.compose(this, q, pos, scale);
        return this;
    }

    decompose(q, pos, scale) {
        Mat4Func.decompose(this, q, pos, scale);
        return this;
    }

    getRotation(q) {
        Mat4Func.getRotation(q, this);
        return this;
    }

    getTranslation(pos) {
        Mat4Func.getTranslation(pos, this);
        return this;
    }

    getScaling(scale) {
        Mat4Func.getScaling(scale, this);
        return this;
    }

    getMaxScaleOnAxis() {
        return Mat4Func.getMaxScaleOnAxis(this);
    }

    lookAt(eye, target, up) {
        Mat4Func.targetTo(this, eye, target, up);
        return this;
    }

    determinant() {
        return Mat4Func.determinant(this);
    }

    fromArray(a, o = 0) {
        this[0] = a[o];
        this[1] = a[o + 1];
        this[2] = a[o + 2];
        this[3] = a[o + 3];
        this[4] = a[o + 4];
        this[5] = a[o + 5];
        this[6] = a[o + 6];
        this[7] = a[o + 7];
        this[8] = a[o + 8];
        this[9] = a[o + 9];
        this[10] = a[o + 10];
        this[11] = a[o + 11];
        this[12] = a[o + 12];
        this[13] = a[o + 13];
        this[14] = a[o + 14];
        this[15] = a[o + 15];
        return this;
    }

    toArray(a = [], o = 0) {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        a[o + 3] = this[3];
        a[o + 4] = this[4];
        a[o + 5] = this[5];
        a[o + 6] = this[6];
        a[o + 7] = this[7];
        a[o + 8] = this[8];
        a[o + 9] = this[9];
        a[o + 10] = this[10];
        a[o + 11] = this[11];
        a[o + 12] = this[12];
        a[o + 13] = this[13];
        a[o + 14] = this[14];
        a[o + 15] = this[15];
        return a;
    }
}
