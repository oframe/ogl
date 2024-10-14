import type { Mat3 } from './Mat3.js';
import type { Mat4 } from './Mat4.js';
import type { Quat } from './Quat.js';
import type { AttributeData } from '../core/Geometry.js';

export type Vec3Tuple = [x: number, y: number, z: number];

/**
 * 3D vector.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Vec3.js | Source}
 */
export class Vec3 extends Array<number> {
    constructor(x?: number, y?: number, z?: number);

    get x(): number;

    get y(): number;

    get z(): number;

    set x(v: number);

    set y(v: number);

    set z(v: number);

    set(x: number | Vec3 | Vec3Tuple, y?: number, z?: number): this;

    copy(v: Vec3): this;

    add(va: Vec3, vb?: Vec3): this;

    sub(va: Vec3, vb?: Vec3): this;

    multiply(v: Vec3 | number): this;

    divide(v: Vec3 | number): this;

    inverse(v?: Vec3): this;

    len(): number;

    distance(v?: Vec3): number;

    squaredLen(): number;

    squaredDistance(v?: Vec3): number;

    negate(v?: Vec3): this;

    cross(va: Vec3, vb?: Vec3): this;

    scale(v: number): this;

    normalize(): this;

    dot(v: Vec3): number;

    equals(v: Vec3): boolean;

    applyMatrix3(mat3: Mat3): this;

    applyMatrix4(mat4: Mat4): this;

    scaleRotateMatrix4(mat4: Mat4): this;

    applyQuaternion(q: Quat): this;

    angle(v: Vec3): number;

    lerp(v: Vec3, t: number): this;

    smoothLerp(v: Vec3, decay: number, dt: number): this;

    clone(): Vec3;

    fromArray(a: number[] | AttributeData, o?: number): this;

    toArray<T extends number[] | AttributeData>(a?: T, o?: number): T;

    transformDirection(mat4: Mat4): this;
}
