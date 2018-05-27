import * as QuatFunc from './functions/QuatFunc.js';

export class Quat extends Float32Array {
    constructor(array = [0, 0, 0, 1]) {
        super(array);
        this.onChange = () => {};
        return this;
    }

    get x() {
        return this[0];
    }

    set x(v) {
        this[0] = v;
        this.onChange();
    }

    get y() {
        return this[1];
    }

    set y(v) {
        this[1] = v;
        this.onChange();
    }

    get z() {
        return this[2];
    }

    set z(v) {
        this[2] = v;
        this.onChange();
    }

    get w() {
        return this[3];
    }

    set w(v) {
        this[3] = v;
        this.onChange();
    }

    identity() {
        QuatFunc.identity(this);
        this.onChange();
        return this;
    }

    set(x, y, z, w) {
        QuatFunc.set(this, x, y, z, w);
        this.onChange();
        return this;
    }

    rotateX(a) {
        QuatFunc.rotateX(this, this, a);
        this.onChange();
        return this;
    }

    rotateY(a) {
        QuatFunc.rotateY(this, this, a);
        this.onChange();
        return this;
    }

    rotateZ(a) {
        QuatFunc.rotateZ(this, this, a);
        this.onChange();
        return this;
    }

    invert(quat = this) {
        QuatFunc.invert(this, quat);
        this.onChange();
        return this;
    }

    copy(quat) {
        QuatFunc.copy(this, quat);
        this.onChange();
        return this;
    }

    normalize(quat = this) {
        QuatFunc.normalize(this, quat);
        this.onChange();
        return this;
    }

    multiply(quatA, quatB) {
        if (quatB) {
            QuatFunc.multiply(this, quatA, quatB);
        } else {
            QuatFunc.multiply(this, this, quatA);
        }
        this.onChange();
        return this;
    }

    fromMatrix3(matrix3) {
        QuatFunc.fromMat3(this, matrix3);
        this.onChange();
        return this;
    }

    fromEuler(euler) {
        QuatFunc.fromEuler(this, euler, euler.order);
        return this;
    }
}
