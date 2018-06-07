import * as Mat3Func from './functions/Mat3Func.js';

export class Mat3 extends Float32Array {
    constructor(array = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
        super(array);
        return this;
    }

    set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        Mat3Func.set(this, m00, m01, m02, m10, m11, m12, m20, m21, m22);
        return this;
    }

    translate(v, m = this) {
        Mat3Func.translate(this, m, v);
        return this;
    }

    rotate(v, m = this) {
        Mat3Func.rotate(this, m, v);
        return this;
    }

    scale(v, m = this) {
        Mat3Func.scale(this, m, v);
        return this;
    }

    multiply(ma, mb) {
        if (mb) {
            Mat3Func.multiply(this, ma, mb);
        } else {
            Mat3Func.multiply(this, this, ma);
        }
        return this;
    }

    identity() {
        Mat3Func.identity(this);
        return this;
    }

    copy(m) {
        Mat3Func.copy(this, m);
        return this;
    }

    fromMatrix4(m) {
        Mat3Func.fromMat4(this, m);
        return this;
    }

    fromQuaternion(q) {
        Mat3Func.fromQuat(this, q);
        return this;
    }

    fromBasis(vec3a, vec3b, vec3c) {
        this.set(
            vec3a[0],
            vec3a[1],
            vec3a[2],
            vec3b[0],
            vec3b[1],
            vec3b[2],
            vec3c[0],
            vec3c[1],
            vec3c[2]
        );
        return this;
    }

    invert(m = this) {
        Mat3Func.invert(this, m);
        return this;
    }

    getNormalMatrix(m) {
        Mat3Func.normalFromMat4(this, m);
        return this;
    }
}
