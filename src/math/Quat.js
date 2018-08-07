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

    invert(q = this) {
        QuatFunc.invert(this, q);
        this.onChange();
        return this;
    }

    conjugate(q = this) {
        QuatFunc.conjugate(this, q);
        this.onChange();
        return this;
    }

    copy(q) {
        QuatFunc.copy(this, q);
        this.onChange();
        return this;
    }

    normalize(q = this) {
        QuatFunc.normalize(this, q);
        this.onChange();
        return this;
    }

    multiply(qA, qB) {
        if (qB) {
            QuatFunc.multiply(this, qA, qB);
        } else {
            QuatFunc.multiply(this, this, qA);
        }
        this.onChange();
        return this;
    }

    dot(v) {
        return QuatFunc.dot(this, v);
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

    slerp(q, t) {
        QuatFunc.slerp(this, this, q, t);
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
