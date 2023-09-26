import { Texture } from '../core/Texture.js';

import type { OGLRenderingContext } from '../core/Renderer.js';

export interface KTXTextureOptions {
    buffer: ArrayBuffer;
    src: string;
    wrapS: number;
    wrapT: number;
    anisotropy: number;
    minFilter: number;
    magFilter: number;
}

/**
 * A {@link https://github.com/KhronosGroup/KTX-Specification | KTX 2.0 GPU Texture} container.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/KTXTexture.js | Source}
 */
export class KTXTexture extends Texture {
    constructor(gl: OGLRenderingContext, options?: Partial<KTXTextureOptions>);

    parseBuffer(buffer: ArrayBuffer): void;
}
