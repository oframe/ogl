import { Mat4 } from './Mat4.js';
import { Quat } from './Quat.js';

export declare type EulerTuple = [x: number, y: number, z: number];
export declare type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';

export declare class Euler extends Array<number> {
    order: EulerOrder;
    onChange: () => void;
    constructor(x?: number, y?: number, z?: number, order?: EulerOrder);
    get x(): number;
    get y(): number;
    get z(): number;
    set x(v: number);
    set y(v: number);
    set z(v: number);
    set(x: number | Euler, y?: number, z?: number): this;
    copy(v: Euler): this;
    reorder(order: EulerOrder): this;
    fromRotationMatrix(m: Mat4, order?: EulerOrder): this;
    fromQuaternion(q: Quat, order?: EulerOrder): this;
    fromArray(a: number[], o?: number): this;
    toArray(a?: number[], o?: number): number[];
}
