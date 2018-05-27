import * as Mat4Func from './functions/Mat4Func.js';

export class Mat4 extends Float32Array {
    constructor(array = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
        super(array);
        return this;
    }

    set x(v) {
        this[12] = v;
    }

    get x() {
        return this[12];
    }

    set y(v) {
        this[13] = v;
    }

    get y() {
        return this[13];
    }

    set z(v) {
        this[14] = v;
    }

    get z() {
        return this[14];
    }

    set w(v) {
        this[15] = v;
    }

    get w() {
        return this[15];
    }

    set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        if (m00.length) {
            return this.copy(m00);
        }
        Mat4Func.set(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        return this;
    }

    translate(vec3, mat4 = this) {
        Mat4Func.translate(this, mat4, vec3);
        return this;
    }

    rotateX(v, mat4 = this) {
        Mat4Func.rotateX(this, mat4, v);
        return this;
    }

    rotateY(v, mat4 = this) {
        Mat4Func.rotateY(this, mat4, v);
        return this;
    }

    rotateZ(v, mat4 = this) {
        Mat4Func.rotateZ(this, mat4, v);
        return this;
    }

    scale(v, mat4 = this) {
        Mat4Func.scale(this, mat4, typeof v === "number" ? [v, v, v] : v);
        return this;
    }

    multiply(mat4a, mat4b) {
        if (mat4b) {
            Mat4Func.multiply(this, mat4a, mat4b);
        } else {
            Mat4Func.multiply(this, this, mat4a);
        }
        return this;
    }

    identity() {
        Mat4Func.identity(this);
        return this;
    }

    copy(mat4) {
        Mat4Func.copy(this, mat4);
        return this;
    }

    fromPerspective({fov, aspect, near, far} = {}) {
        Mat4Func.perspective(this, fov, aspect, near, far);
        return this;
    }

    fromOrthogonal({left, right, bottom, top, near, far}) {
        Mat4Func.ortho(this, left, right, bottom, top, near, far);
        return this;
    }

    fromQuaternion(quat) {
        Mat4Func.fromQuat(this, quat);
        return this;
    }

    setPosition(vec3) {
        this.x = vec3[0];
        this.y = vec3[1];
        this.z = vec3[2];
        return this;
    }

    invert(mat4 = this) {
        Mat4Func.invert(this, mat4);
        return this;
    }

    compose(quat, pos, scale) {
        Mat4Func.fromRotationTranslationScale(this, quat, pos, scale);
        return this;
    }

    getRotation(quat) {
        Mat4Func.getRotation(quat, this);
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

    lookAt(eye, target, up) {
        Mat4Func.targetTo(this, eye, target, up);
        return this;
    }

    determinant() {
        return Mat4Func.determinant(this);
    }
}
