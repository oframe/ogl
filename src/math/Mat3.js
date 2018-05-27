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

    translate(vec2, mat3 = this) {
        Mat3Func.translate(this, mat3, vec2);
        return this;
    }

    rotate(v, mat3 = this) {
        Mat3Func.rotate(this, mat3, v);
        return this;
    }

    scale(vec2, mat3 = this) {
        Mat3Func.scale(this, mat3, vec2);
        return this;
    }

    multiply(mat3a, mat3b) {
        if (mat3b) {
            Mat3Func.multiply(this, mat3a, mat3b);
        } else {
            Mat3Func.multiply(this, this, mat3a);
        }
        return this;
    }

    identity() {
        Mat3Func.identity(this);
        return this;
    }

    copy(mat3) {
        Mat3Func.copy(this, mat3);
        return this;
    }

    fromMatrix4(mat4) {
        Mat3Func.fromMat4(this, mat4);
        return this;
    }

    fromQuaternion(quat) {
        Mat3Func.fromQuat(this, quat);
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

    invert(mat3 = this) {
        Mat3Func.invert(this, mat3);
        return this;
    }

    getNormalMatrix(mat4) {
        Mat3Func.normalFromMat4(this, mat4);
        return this;
    }
}
