import { Texture } from '../core/Texture.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { TextureOptions } from '../core/Texture.js';

export interface Texture3DOptions extends TextureOptions {
    src: string;
    tileCountX: number;
}

/**
 * A class for rearranging a flat 3D texture from software like Houdini.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Texture3D.js | Source}
 */
export class Texture3D extends Texture {
    constructor(gl: OGLRenderingContext, options?: Partial<Texture3DOptions>);
}
