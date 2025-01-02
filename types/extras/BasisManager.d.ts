import type { OGLRenderingContext } from '../core/Renderer.js';

export type BasisManagerFormat = 'astc' | 'bptc' | 's3tc' | 'etc1' | 'pvrtc' | 'none';

export type BasisImage = (Uint8Array | Uint16Array) & {
    width: number;
    height: number;
    isCompressedTexture: boolean;
    internalFormat: number;
    isBasis: boolean;
};

/**
 * A {@link https://github.com/BinomialLLC/basis_universal | Basis Universal GPU Texture} loader.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/BasisManager.js | Source}
 */
export class BasisManager {
    constructor(workerSrc: string | URL, gl?: OGLRenderingContext);

    getSupportedFormat(gl?: OGLRenderingContext): BasisManagerFormat;

    initWorker(workerSrc: string | URL): void;

    onMessage(event: { data: { id: number; error: string; image: BasisImage } }): void;

    parseTexture(buffer: ArrayBuffer): Promise<BasisImage>;
}
