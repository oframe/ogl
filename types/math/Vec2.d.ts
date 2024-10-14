import type { Mat3 } from './Mat3.js';
import type { Mat4 } from './Mat4.js';
import type { AttributeData } from '../core/Geometry.js';

export type Vec2Tuple = [x: number, y: number];

/**
 * 2D vector.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Vec2.js | Source}
 */
export class Vec2 extends Array<number> {
    constructor(x?: number, y?: number);

    get x(): number;

    get y(): number;

    set x(v: number);

    set y(v: number);

    set(x: number | Vec2 | Vec2Tuple, y?: number): this;

    copy(v: Vec2): this;

    add(va: Vec2, vb?: Vec2): this;

    sub(va: Vec2, vb?: Vec2): this;

    multiply(v: Vec2 | number): this;

    divide(v: Vec2 | number): this;

    inverse(v?: Vec2): this;

    len(): number;

    distance(v?: Vec2): number;

    squaredLen(): number;

    squaredDistance(v?: Vec2): number;

    negate(v?: Vec2): this;

    cross(va: Vec2, vb?: Vec2): number;

    scale(v: number): this;

    normalize(): this;

    dot(v: Vec2): number;

    equals(v: Vec2): boolean;

    applyMatrix3(mat3: Mat3): this;

    applyMatrix4(mat4: Mat4): this;

    lerp(v: Vec2, a: number): this;

    smoothLerp(v: Vec2, decay: number, dt: number): this;

    clone(): Vec2;

    fromArray(a: number[] | AttributeData, o?: number): this;

    toArray<T extends number[] | AttributeData>(a?: T, o?: number): T;
}
