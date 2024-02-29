import * as QuatFunc from './functions/QuatFunc.js';

export class Quat extends Array {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        super(x, y, z, w);
        this.onChange = () => {};

        // Keep reference to proxy target to avoid triggering onChange internally
        this._target = this;

        // Return a proxy to trigger onChange when array elements are edited directly
        const triggerProps = ['0', '1', '2', '3'];
        return new Proxy(this, {
            set(target, property) {
                const success = Reflect.set(...arguments);
                if (success && triggerProps.includes(property)) target.onChange();
                return success;
            },
        });
    }

    get x() {
        return this[0];
    }

    get y() {
        return this[1];
    }

    get z() {
        return this[2];
    }

    get w() {
        return this[3];
    }

    set x(v) {
        this._target[0] = v;
        this.onChange();
    }

    set y(v) {
        this._target[1] = v;
        this.onChange();
    }

    set z(v) {
        this._target[2] = v;
        this.onChange();
    }

    set w(v) {
        this._target[3] = v;
        this.onChange();
    }

    identity() {
        QuatFunc.identity(this._target);
        this.onChange();
        return this;
    }

    set(x, y, z, w) {
        if (x.length) return this.copy(x);
        QuatFunc.set(this._target, x, y, z, w);
        this.onChange();
        return this;
    }

    rotateX(a) {
        QuatFunc.rotateX(this._target, this._target, a);
        this.onChange();
        return this;
    }

    rotateY(a) {
        QuatFunc.rotateY(this._target, this._target, a);
        this.onChange();
        return this;
    }

    rotateZ(a) {
        QuatFunc.rotateZ(this._target, this._target, a);
        this.onChange();
        return this;
    }

    inverse(q = this._target) {
        QuatFunc.invert(this._target, q);
        this.onChange();
        return this;
    }

    conjugate(q = this._target) {
        QuatFunc.conjugate(this._target, q);
        this.onChange();
        return this;
    }

    copy(q) {
        QuatFunc.copy(this._target, q);
        this.onChange();
        return this;
    }

    normalize(q = this._target) {
        QuatFunc.normalize(this._target, q);
        this.onChange();
        return this;
    }

    multiply(qA, qB) {
        if (qB) {
            QuatFunc.multiply(this._target, qA, qB);
        } else {
            QuatFunc.multiply(this._target, this._target, qA);
        }
        this.onChange();
        return this;
    }

    dot(v) {
        return QuatFunc.dot(this._target, v);
    }

    fromMatrix3(matrix3) {
        QuatFunc.fromMat3(this._target, matrix3);
        this.onChange();
        return this;
    }

    fromEuler(euler, isInternal) {
        QuatFunc.fromEuler(this._target, euler, euler.order);
        // Avoid infinite recursion
        if (!isInternal) this.onChange();
        return this;
    }

    fromAxisAngle(axis, a) {
        QuatFunc.setAxisAngle(this._target, axis, a);
        this.onChange();
        return this;
    }

    slerp(q, t) {
        QuatFunc.slerp(this._target, this._target, q, t);
        this.onChange();
        return this;
    }

    fromArray(a, o = 0) {
        this._target[0] = a[o];
        this._target[1] = a[o + 1];
        this._target[2] = a[o + 2];
        this._target[3] = a[o + 3];
        this.onChange();
        return this;
    }

    toArray(a = [], o = 0) {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        a[o + 3] = this[3];
        return a;
    }
}
