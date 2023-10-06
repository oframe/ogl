import { Mat4 } from './Mat4.js';

import type { Quat } from './Quat.js';
import type { AttributeData } from '../core/Geometry.js';

export type EulerTuple = [x: number, y: number, z: number];

export type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';

/**
 * Implementation of {@link https://en.wikipedia.org/wiki/Euler_angles | Euler angles}.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Euler.js | Source}
 */
export class Euler extends Array<number> {
    order: EulerOrder;
    onChange: () => void;

    constructor(x?: number, y?: number, z?: number, order?: EulerOrder);

    get x(): number;

    get y(): number;

    get z(): number;

    set x(v: number);

    set y(v: number);

    set z(v: number);

    set(x: number | Euler | EulerTuple, y?: number, z?: number): this;

    copy(v: Euler): this;

    reorder(order: EulerOrder): this;

    fromRotationMatrix(m: Mat4, order?: EulerOrder): this;

    fromQuaternion(q: Quat, order?: EulerOrder): this;

    fromArray(a: number[] | AttributeData, o?: number): this;

    toArray<T extends number[] | AttributeData>(a?: T, o?: number): T;
}
