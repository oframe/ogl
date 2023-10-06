import { Vec3 } from '../math/Vec3.js';
import { Quat } from '../math/Quat.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { BoneTransform } from './Skin.js';

export interface AnimationFrame {
    position: Vec3;
    quaternion: Quat;
    scale: Vec3;
}

export interface AnimationData {
    frames: AnimationFrame[];
}

export interface AnimationOptions {
    objects: BoneTransform[];
    data: AnimationData;
}

/**
 * A class for animation.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Animation.js | Source}
 */
export class Animation {
    objects: BoneTransform[];
    data: AnimationData;
    elapsed: number;
    weight: number;
    duration: number;

    constructor(gl: OGLRenderingContext, options?: Partial<AnimationOptions>);

    update(totalWeight?: number, isSet?: boolean): void;
}
