import type { Euler } from '../math/Euler.js';
import type { Mat4 } from '../math/Mat4.js';
import type { Quat } from '../math/Quat.js';
import type { Vec3 } from '../math/Vec3.js';

export declare class Transform {
    parent: Transform | null;
    children: Transform[];
    visible: boolean;
    matrix: Mat4;
    worldMatrix: Mat4;
    matrixAutoUpdate: boolean;
    worldMatrixNeedsUpdate: boolean;
    position: Vec3;
    scale: Vec3;
    up: Vec3;
    quaternion: Quat;
    rotation: Euler;
    constructor();
    setParent(parent: Transform | null, notifyParent?: boolean): void;
    addChild(child: Transform, notifyChild?: boolean): void;
    removeChild(child: Transform, notifyChild?: boolean): void;
    updateMatrixWorld(force?: boolean): void;
    updateMatrix(): void;
    traverse(callback: (node: Transform) => boolean | void): void;
    decompose(): void;
    lookAt(target: Vec3, invert?: boolean): void;
}
