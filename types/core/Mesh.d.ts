import { Transform } from './Transform.js';
import { Mat3 } from '../math/Mat3.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';
import { Camera } from './Camera.js';
import { Geometry } from './Geometry.js';
import { Program } from './Program.js';
import { OGLRenderingContext } from './Renderer.js';

export interface MeshOptions {
    geometry: Geometry;
    program: Program;
    mode: GLenum;
    frustumCulled: boolean;
    renderOrder: number;
}

export interface DrawOptions {
    camera: Camera;
}

export declare type MeshRenderCallback = (renderInfo: { mesh: Mesh; camera?: Camera }) => any;

export interface RaycastHit {
    localPoint: Vec3;
    distance: number;
    point: Vec3;
    faceNormal: Vec3;
    localFaceNormal: Vec3;
    uv: Vec2;
    localNormal: Vec3;
    normal: Vec3;
}

export declare class Mesh extends Transform {
    gl: OGLRenderingContext;
    id: number;
    geometry: Geometry;
    program: Program;
    mode: GLenum;
    frustumCulled: boolean;
    renderOrder: number;
    modelViewMatrix: Mat4;
    normalMatrix: Mat3;
    beforeRenderCallbacks: MeshRenderCallback[];
    afterRenderCallbacks: MeshRenderCallback[];
    constructor(gl: OGLRenderingContext, { geometry, program, mode, frustumCulled, renderOrder }?: Partial<MeshOptions>);
    onBeforeRender(f: MeshRenderCallback): this;
    onAfterRender(f: MeshRenderCallback): this;
    draw({ camera }?: { camera?: Camera }): void;
}
