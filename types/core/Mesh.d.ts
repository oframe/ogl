import { Transform } from './Transform.js';
import { Mat3 } from '../math/Mat3.js';
import { Mat4 } from '../math/Mat4.js';

import type { OGLRenderingContext } from './Renderer.js';
import type { Vec2 } from '../math/Vec2.js';
import type { Vec3 } from '../math/Vec3.js';
import type { Geometry } from './Geometry.js';
import type { Program } from './Program.js';
import type { Camera } from './Camera.js';

export interface MeshOptions<
    TGeometry extends Geometry = Geometry,
    TProgram extends Program = Program,
> {
    geometry: TGeometry;
    program: TProgram;
    mode: GLenum;
    frustumCulled: boolean;
    renderOrder: number;
}

export type MeshRenderCallback = (renderInfo: { mesh: Mesh; camera?: Camera }) => any;

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

/**
 * Represents a {@link https://en.wikipedia.org/wiki/Polygon_mesh | polygon mesh}.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Mesh.js | Source}
 */
export class Mesh<
    TGeometry extends Geometry = Geometry,
    TProgram extends Program = Program,
> extends Transform {
    gl: OGLRenderingContext;
    id: number;
    geometry: TGeometry;
    program: TProgram;
    mode: GLenum;

    frustumCulled: boolean;

    renderOrder: number;
    modelViewMatrix: Mat4;
    normalMatrix: Mat3;
    beforeRenderCallbacks: MeshRenderCallback[];
    afterRenderCallbacks: MeshRenderCallback[];

    hit?: Partial<RaycastHit>; // Set from raycaster

    constructor(gl: OGLRenderingContext, options?: Partial<MeshOptions>);

    onBeforeRender(f: MeshRenderCallback): this;

    onAfterRender(f: MeshRenderCallback): this;

    draw(options?: { camera?: Camera }): void;
}
