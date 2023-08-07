import { Transform } from './Transform.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { Mesh } from './Mesh.js';
import { OGLRenderingContext } from './Renderer.js';

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

export declare type CameraType = 'perspective' | 'orthographic';

export declare class Camera extends Transform {
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
    constructor(gl: OGLRenderingContext, { near, far, fov, aspect, left, right, bottom, top, zoom }?: Partial<CameraOptions>);
    perspective({ near, far, fov, aspect }?: Partial<PerspectiveOptions>): this;
    orthographic({ near, far, left, right, bottom, top, zoom }?: Partial<OrthographicOptions>): this;
    updateMatrixWorld(): this;
    lookAt(target: any): this;
    project(v: Vec3): this;
    unproject(v: Vec3): this;
    updateFrustum(): void;
    frustumIntersectsMesh(node: Mesh, worldMatrix?: Mat4): boolean;
    frustumIntersectsSphere(center: Vec3, radius: number): boolean;
}
