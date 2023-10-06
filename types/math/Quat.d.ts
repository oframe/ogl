import type { Euler } from './Euler.js';
import type { Mat3 } from './Mat3.js';
import type { Vec3 } from './Vec3.js';
import type { AttributeData } from '../core/Geometry.js';

export type QuatTuple = [x: number, y: number, z: number, w: number];

/**
 * Implementation of a quaternion.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Quat.js | Source}
 */
export class Quat extends Array<number> {
    onChange: () => void;

    constructor(x?: number, y?: number, z?: number, w?: number);

    get x(): number;

    get y(): number;

    get z(): number;

    get w(): number;

    set x(v: number);

    set y(v: number);

    set z(v: number);

    set w(v: number);

    identity(): this;

    set(x: number | Quat | QuatTuple, y: number, z: number, w: number): this;

    rotateX(a: number): this;

    rotateY(a: number): this;

    rotateZ(a: number): this;

    inverse(q?: Quat): this;

    conjugate(q?: Quat): this;

    copy(q: Quat): this;

    normalize(q?: Quat): this;

    multiply(qA: Quat, qB?: Quat): this;

    dot(v: Quat): number;

    fromMatrix3(matrix3: Mat3): this;

    fromEuler(euler: Euler): this;

    fromAxisAngle(axis: Vec3, a: number): this;

    slerp(q: Quat, t: number): this;

    fromArray(a: number[] | AttributeData, o?: number): this;

    toArray<T extends number[] | AttributeData>(a?: T, o?: number): T;
}
