import * as EulerFunc from './functions/EulerFunc.js';
import {Mat4} from './Mat4.js';

const tmpMat4 = new Mat4();

export class Euler extends Float32Array {
    constructor(array = [0, 0, 0], order = 'YXZ') {
        super(3);
        if (typeof array === 'string') array = this.hexToRGB(array);
        this.onChange = () => {};
        this.set(...array);
        this.reorder(order);
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

    set(x, y = x, z = x) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this.onChange();
        return this;
    }

    reorder(order) {
        this.order = order;
        this.onChange();
        return this;
    }

    fromRotationMatrix(mat4, order = this.order) {
        EulerFunc.fromRotationMatrix(this, mat4, order);
        return this;
    }

    fromQuaternion(quat, order = this.order) {
        tmpMat4.fromQuaternion(quat);
        return this.fromRotationMatrix(tmpMat4, order);
    }
}