import type { OGLRenderingContext, RenderState } from './Renderer';

export type CompressedImage = {
    isCompressedTexture?: boolean;
    data: Uint8Array;
    width: number;
    height: number;
}[];

export type ImageRepresentation =
    | HTMLImageElement
    | HTMLVideoElement
    | HTMLImageElement[]
    | ArrayBufferView
    | CompressedImage;

export interface TextureOptions {
    image: ImageRepresentation;
    target: number;
    type: number;
    format: number;
    internalFormat: number;
    wrapS: number;
    wrapT: number;
    generateMipmaps: boolean;
    minFilter: number;
    magFilter: number;
    premultiplyAlpha: boolean;
    unpackAlignment: number;
    flipY: boolean;
    anisotropy: number;
    level: number;
    width: number;
    height: number;
}

/**
 * A surface, reflection, or refraction map.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Texture.js | Source}
 */
export class Texture {
    gl: OGLRenderingContext;
    id: number;

    image?: ImageRepresentation;
    target: number;
    type: number;
    format: number;
    internalFormat: number;
    minFilter: number;
    magFilter: number;
    wrapS: number;
    wrapT: number;
    generateMipmaps: boolean;
    premultiplyAlpha: boolean;
    unpackAlignment: number;
    flipY: boolean;
    anisotropy: number;
    level: number;
    width: number;
    height: number;
    texture: WebGLTexture;

    store: {
        image?: ImageRepresentation | null;
    };

    glState: RenderState;

    state: {
        minFilter: number;
        magFilter: number;
        wrapS: number;
        wrapT: number;
        anisotropy: number;
    };

    needsUpdate: boolean;
    onUpdate?: () => void;

    // Set from texture loader
    ext?: string;
    name?: string;
    loaded?: Promise<Texture>;

    constructor(gl: OGLRenderingContext, options?: Partial<TextureOptions>);

    bind(): void;

    update(textureUnit?: number): void;
}
