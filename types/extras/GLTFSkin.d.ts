import { Mesh } from '../core/Mesh.js';
import { Mat4 } from '../math/Mat4.js';
import { Texture } from '../core/Texture.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Geometry } from '../core/Geometry.js';
import type { Program } from '../core/Program.js';
import type { Camera } from '../core/Camera.js';

export interface GLTFSkinSkeleton {
    joints: { worldMatrix: Mat4; bindInverse: Mat4 }[];
}

export interface GLTFSkinOptions {
    skeleton: GLTFSkinSkeleton;
    geometry: Geometry;
    program: Program;
    mode: GLenum;
}

/**
 * A mesh with a skeleton and bones for animation.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/GLTFSkin.js | Source}
 */
export class GLTFSkin<TProgram extends Program = Program> extends Mesh {
    skeleton: GLTFSkinSkeleton;
    program: TProgram;

    boneMatrices: Float32Array;
    boneTextureSize: number;
    boneTexture: Texture;

    constructor(gl: OGLRenderingContext, options?: Partial<GLTFSkinOptions>);

    createBoneTexture(): void;

    updateUniforms(): void;

    override draw(options?: { camera?: Camera }): void;
}
