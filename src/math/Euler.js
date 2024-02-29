import * as EulerFunc from './functions/EulerFunc.js';
import { Mat4 } from './Mat4.js';

const tmpMat4 = /* @__PURE__ */ new Mat4();

export class Euler extends Array {
    constructor(x = 0, y = x, z = x, order = 'YXZ') {
        super(x, y, z);
        this.order = order;
        this.onChange = () => {};

        // Keep reference to proxy target to avoid triggering onChange internally
        this._target = this;

        // Return a proxy to trigger onChange when array elements are edited directly
        const triggerProps = ['0', '1', '2'];
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

    set(x, y = x, z = x) {
        if (x.length) return this.copy(x);
        this._target[0] = x;
        this._target[1] = y;
        this._target[2] = z;
        this.onChange();
        return this;
    }

    copy(v) {
        this._target[0] = v[0];
        this._target[1] = v[1];
        this._target[2] = v[2];
        this.onChange();
        return this;
    }

    reorder(order) {
        this._target.order = order;
        this.onChange();
        return this;
    }

    fromRotationMatrix(m, order = this.order) {
        EulerFunc.fromRotationMatrix(this._target, m, order);
        this.onChange();
        return this;
    }

    fromQuaternion(q, order = this.order, isInternal) {
        tmpMat4.fromQuaternion(q);
        this._target.fromRotationMatrix(tmpMat4, order);
        // Avoid infinite recursion
        if (!isInternal) this.onChange();
        return this;
    }

    fromArray(a, o = 0) {
        this._target[0] = a[o];
        this._target[1] = a[o + 1];
        this._target[2] = a[o + 2];
        return this;
    }

    toArray(a = [], o = 0) {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        return a;
    }
}
