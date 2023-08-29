import { OGLRenderingContext, RenderState } from './Renderer';

export declare type CompressedImage = {
    isCompressedTexture?: boolean;
} & {
    data: Uint8Array;
    width: number;
    height: number;
}[];

export declare type ImageRepresentation = HTMLImageElement | HTMLVideoElement | HTMLImageElement[] | ArrayBufferView | CompressedImage;

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
    level: number;
    width: number;
    height: number;
    anisotropy: number;
}

export declare class Texture {
    ext: string;
    gl: OGLRenderingContext;
    id: number;
    name: string;
    image?: ImageRepresentation;
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
    level: number;
    width: number;
    height: number;
    anisotropy: number;
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
    constructor(
        gl: OGLRenderingContext,
        {
            image,
            target,
            type,
            format,
            internalFormat,
            wrapS,
            wrapT,
            generateMipmaps,
            minFilter,
            magFilter,
            premultiplyAlpha,
            unpackAlignment,
            flipY,
            anisotropy,
            level,
            width, // used for RenderTargets or Data Textures
            height,
        }?: Partial<TextureOptions>
    );
    bind(): void;
    update(textureUnit?: number): void;
}
