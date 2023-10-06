import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { Texture } from '../core/Texture.js';
import { RenderTarget } from '../core/RenderTarget.js';
import { Triangle } from './Triangle.js';

import type { OGLRenderingContext } from '../core/Renderer.js';

export interface GPGPUOptions {
    data: Float32Array;
    geometry: Triangle;
    type: Texture['type'];
}

export interface GPGPUPass {
    mesh: Mesh;
    program: Program;
    uniforms: Record<string, any>;
    enabled: boolean;
    textureUniform: string;
    vertex: string;
    fragment: string;
}

/**
 * A class for {@link https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units | GPGPU (General Purpose GPU)} calculations.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/GPGPU.js | Source}
 */
export class GPGPU {
    gl: OGLRenderingContext;
    passes: GPGPUPass[];
    geometry: Triangle;
    dataLength: number;
    size: number;
    coords: Float32Array;
    uniform: { value: any };

    fbo: {
        read: RenderTarget;
        write: RenderTarget;
        swap: () => void;
    };

    constructor(gl: OGLRenderingContext, options?: Partial<GPGPUOptions>);

    addPass(options?: Partial<GPGPUPass>): GPGPUPass;

    render(): void;
}
