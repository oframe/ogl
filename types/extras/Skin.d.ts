import { Mesh } from '../core/Mesh.js';
import { Transform } from '../core/Transform.js';
import { Mat4 } from '../math/Mat4.js';
import { Texture } from '../core/Texture.js';
import { Animation } from './Animation.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Quat } from '../math/Quat.js';
import type { Vec3 } from '../math/Vec3.js';
import type { Geometry } from '../core/Geometry.js';
import type { Program } from '../core/Program.js';
import type { Camera } from '../core/Camera.js';

export interface SkinRig {
    bindPose: { position: Vec3; quaternion: Quat; scale: Vec3 };
    bones: { name: string; parent: Transform }[];
}

export interface SkinOptions {
    rig: SkinRig;
    geometry: Geometry;
    program: Program;
    mode: GLenum;
}

export interface BoneTransform extends Transform {
    name: string;
    bindInverse: Mat4;
}

/**
 * A mesh with a skeleton and bones for animation.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Skin.js | Source}
 */
export class Skin extends Mesh {
    root: Transform;

    bones: Transform[];

    boneMatrices: Float32Array;
    boneTextureSize: number;
    boneTexture: Texture;
    animations: Animation[];

    constructor(gl: OGLRenderingContext, options?: Partial<SkinOptions>);

    createBones(rig: SkinRig): void;

    createBoneTexture(): void;

    addAnimation(data: Animation['data']): Animation;

    update(): void;

    override draw(options?: { camera?: Camera }): void;
}
