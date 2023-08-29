import { Vec2 } from './Vec2.js';
import { Vec3 } from './Vec3.js';
import { Quat } from './Quat.js';
import { Mat4 } from './Mat4.js';

export declare type Mat3Tuple = [m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number];

export declare class Mat3 extends Array<number> {
    constructor(m00?: number, m01?: number, m02?: number, m10?: number, m11?: number, m12?: number, m20?: number, m21?: number, m22?: number);
    set(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): this;
    set(m: Mat3): this;
    translate(v: Vec2, m?: Mat3): this;
    rotate(v: number, m?: Mat3): this;
    scale(v: Vec2, m?: Mat3): this;
    multiply(ma: Mat3, mb?: Mat3): this;
    identity(): this;
    copy(m: Mat3): this;
    fromMatrix4(m: Mat4): this;
    fromQuaternion(q: Quat): this;
    fromBasis(vec3a: Vec3, vec3b: Vec3, vec3c: Vec3): this;
    inverse(m?: Mat3): this;
    getNormalMatrix(m: Mat4): this;
}
