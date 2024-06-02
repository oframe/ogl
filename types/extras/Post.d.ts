import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { RenderTarget } from '../core/RenderTarget.js';
import { Triangle } from './Triangle.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Camera } from '../core/Camera.js';
import type { Transform } from '../core/Transform.js';
import type { Texture } from '../core/Texture.js';

export interface PostOptions {
    width: number;
    height: number;
    dpr: number;
    wrapS: GLenum;
    wrapT: GLenum;
    minFilter: GLenum;
    magFilter: GLenum;
    geometry: Triangle;
    targetOnly: boolean;
    depth: boolean;
}

export interface Pass {
    mesh: Mesh;
    program: Program;
    uniforms: Record<string, any>;
    enabled: boolean;
    textureUniform: string;
    vertex: string;
    fragment: string;
}

/**
 * A class for managing post-processing shader passes.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Post.js | Source}
 */
export class Post {
    gl: OGLRenderingContext;

    passes: Pass[];

    geometry: Triangle;

    uniform: { value: any };
    targetOnly: boolean;

    dpr: number;
    width: number;
    height: number;

    resolutionWidth: number;
    resolutionHeight: number;

    fbo: {
        read: RenderTarget;
        write: RenderTarget;
        swap: () => void;
    };

    constructor(gl: OGLRenderingContext, options?: Partial<PostOptions>);

    addPass(options?: Partial<Pass>): Pass;

    resize(
        options?: Partial<{
            width: number;
            height: number;
            dpr: number;
        }>,
    ): void;

    render(
        options: Partial<{
            scene: Transform;
            camera: Camera;
            texture: Texture;
            target: RenderTarget;
            update: boolean;
            sort: boolean;
            frustumCull: boolean;
            beforePostCallbacks: Function[];
        }>,
    ): void;
}
