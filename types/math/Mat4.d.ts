import type { Quat } from './Quat.js';
import type { Vec3 } from './Vec3.js';
import type { AttributeData } from '../core/Geometry.js';

export type Mat4Tuple = [
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number,
];

/**
 * 4x4 matrix.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Mat4.js | Source}
 */
export class Mat4 extends Array<number> {
    constructor(
        m00?: number,
        m01?: number,
        m02?: number,
        m03?: number,
        m10?: number,
        m11?: number,
        m12?: number,
        m13?: number,
        m20?: number,
        m21?: number,
        m22?: number,
        m23?: number,
        m30?: number,
        m31?: number,
        m32?: number,
        m33?: number,
    );

    get x(): number;

    get y(): number;

    get z(): number;

    get w(): number;

    set x(v: number);

    set y(v: number);

    set z(v: number);

    set w(v: number);

    set(
        m00: number | Mat4 | Mat4Tuple,
        m01: number,
        m02: number,
        m03: number,
        m10: number,
        m11: number,
        m12: number,
        m13: number,
        m20: number,
        m21: number,
        m22: number,
        m23: number,
        m30: number,
        m31: number,
        m32: number,
        m33: number,
    ): this;

    translate(v: Vec3, m?: Mat4): this;

    rotate(v: number, axis: Vec3, m?: Mat4): this;

    scale(v: Vec3 | number, m?: Mat4): this;

    add(ma: Mat4, mb?: Mat4): this;

    sub(ma: Mat4, mb?: Mat4): this;

    multiply(ma: Mat4 | number, mb?: Mat4): this;

    identity(): this;

    copy(m: Mat4): this;

    fromPerspective(options: { fov: number; aspect: number; near: number; far: number }): this;

    fromOrthogonal(options: { left: number; right: number; bottom: number; top: number; near: number; far: number }): this;

    fromQuaternion(q: Quat): this;

    setPosition(v: Vec3): this;

    inverse(m?: Mat4): this;

    compose(q: Quat, pos: Vec3, scale: Vec3): this;

    getRotation(q: Quat): this;

    getTranslation(pos: Vec3): this;

    getScaling(scale: Vec3): this;

    getMaxScaleOnAxis(): number;

    lookAt(eye: Vec3, target: Vec3, up: Vec3): this;

    determinant(): number;

    fromArray(a: number[] | AttributeData, o?: number): this;

    toArray<T extends number[] | AttributeData>(a?: T, o?: number): T;
}
