import { Texture } from '../core/Texture.js';

import type { OGLRenderingContext } from '../core/Renderer.js';

/**
 * The texture loader.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/TextureLoader.js | Source}
 */
export class TextureLoader {
    static load(gl: OGLRenderingContext, options?: object): Texture;

    static getSupportedExtensions(gl: OGLRenderingContext): string[];

    static loadKTX(src: string, texture: Texture): Promise<void>;

    static loadImage(gl: OGLRenderingContext, src: string, texture: Texture, flipY: boolean): Promise<HTMLImageElement | ImageBitmap>;

    static clearCache(): void;
}
