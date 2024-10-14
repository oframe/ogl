import { Transform } from './Transform.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';

import type { OGLRenderingContext } from './Renderer.js';
import type { Vec3Tuple } from '../math/Vec3.js';
import type { Mesh } from './Mesh.js';

export interface CameraOptions {
    near: number;
    far: number;
    fov: number;
    aspect: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
    zoom: number;
}

export interface PerspectiveOptions extends Pick<CameraOptions, 'near' | 'far' | 'fov' | 'aspect'> {}

export interface OrthographicOptions extends Pick<CameraOptions, 'near' | 'far' | 'left' | 'right' | 'bottom' | 'top' | 'zoom'> {}

export type CameraType = 'perspective' | 'orthographic';

/**
 * A perspective or orthographic camera.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Camera.js | Source}
 */
export class Camera extends Transform {
    projectionMatrix: Mat4;
    viewMatrix: Mat4;
    projectionViewMatrix: Mat4;
    worldPosition: Vec3;

    type: CameraType;

    near: number;
    far: number;
    fov: number;
    aspect: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
    zoom: number;

    frustum: (Vec3 & {
        constant: number;
    })[];

    constructor(gl: OGLRenderingContext, options?: Partial<CameraOptions>);

    perspective(options?: Partial<PerspectiveOptions>): this;

    orthographic(options?: Partial<OrthographicOptions>): this;

    updateMatrixWorld(): this;

    updateProjectionMatrix(): this;

    lookAt(target: Vec3 | Vec3Tuple): this;

    project(v: Vec3): this;

    unproject(v: Vec3): this;

    updateFrustum(): void;

    frustumIntersectsMesh(node: Mesh, worldMatrix?: Mat4): boolean;

    frustumIntersectsSphere(center: Vec3, radius: number): boolean;
}
