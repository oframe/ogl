import type { Euler } from '../math/Euler.js';
import type { Mat4 } from '../math/Mat4.js';
import type { Quat } from '../math/Quat.js';
import type { Vec3, Vec3Tuple } from '../math/Vec3.js';
import type { GLTFLoader } from '../extras/GLTFLoader.d.js';

/**
 * The base class for most objects and provides a set of properties and methods for manipulating
 * objects in 3D space.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Transform.js | Source}
 */
export class Transform {
    /**
     * The parent.
     * @see {@link https://en.wikipedia.org/wiki/Scene_graph | scene graph}.
     */
    parent: Transform | null;

    /**
     * An array with the children.
     */
    children: Transform[];

    /**
     * The visibility.
     */
    visible: boolean;

    /**
     * The local transform matrix.
     */
    matrix: Mat4;

    /**
     * The world transform matrix.
     */
    worldMatrix: Mat4;

    /**
     * When set, it updates the local transform matrix every frame and also updates the worldMatrix
     * property.
     * @defaultValue `true`
     */
    matrixAutoUpdate: boolean;

    /**
     * When set, it updates the world transform matrix in that frame and resets this property to
     * false.
     * @defaultValue `false`
     */
    worldMatrixNeedsUpdate: boolean;

    /**
     * The local position.
     */
    position: Vec3;

    /**
     * The local rotation as a {@link Quat | Quaternion}.
     */
    quaternion: Quat;

    /**
     * The local scale.
     * @defaultValue `new Vec3(1)`
     */
    scale: Vec3;

    /**
     * The local rotation as {@link Euler | Euler angles}.
     */
    rotation: Euler;

    /**
     * Up vector used by the {@link lookAt | lookAt} method.
     * @defaultValue `new Vec3(0, 1, 0)`
     */
    up: Vec3;

    /**
     * Set from {@link GLTFLoader | GLTF Loader}.
     */
    name?: string;
    extras?: Record<string, any>;
    extensions?: Record<string, any>;

    /**
     * Creates a new transform object.
     */
    constructor();

    /**
     * Sets the parent.
     * @param {Transform | null} parent The parent.
     * @param {boolean} [notifyParent=true] Adds this as a child of the parent.
     */
    setParent(parent: Transform | null, notifyParent?: boolean): void;

    /**
     * Adds a child.
     * @param {Transform} child The child.
     * @param {boolean} [notifyChild=true] Sets the parent of the child to this.
     */
    addChild(child: Transform, notifyChild?: boolean): void;

    /**
     * Removes a child.
     * @param {Transform} child The child.
     * @param {boolean} [notifyChild=true] Sets the parent of the child to null.
     */
    removeChild(child: Transform, notifyChild?: boolean): void;

    /**
     * Updates the world transform matrix.
     */
    updateMatrixWorld(force?: boolean): void;

    /**
     * Updates the local transform matrix.
     */
    updateMatrix(): void;

    /**
     * Executes the callback on this transform object and all descendants.
     * @param {Function} callback The callback.
     */
    traverse(callback: (node: Transform) => boolean | void): void;

    /**
     * Decomposes this transform object into it's position, quaternion and scale components.
     */
    decompose(): void;

    /**
     * Rotates this transform object to face a target vector.
     * @param {Vec3 | Vec3Tuple} target A target vector to look at.
     * @param {boolean} [invert=false] Invert the local position and target vector.
     */
    lookAt(target: Vec3 | Vec3Tuple, invert?: boolean): void;
}
