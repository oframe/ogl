import { Texture } from './Texture.js';

import type { OGLRenderingContext } from './Renderer.js';

export interface RenderTargetOptions {
    width: number;
    height: number;
    target: GLenum;
    color: number;
    depth: boolean;
    stencil: boolean;
    depthTexture: boolean;
    wrapS: GLenum;
    wrapT: GLenum;
    minFilter: GLenum;
    magFilter: GLenum;
    type: GLenum;
    format: GLenum;
    internalFormat: GLenum;
    unpackAlignment: number;
    premultiplyAlpha: boolean;
}

export class RenderTarget {
    gl: OGLRenderingContext;
    width: number;
    height: number;
    depth: boolean;
    buffer: WebGLFramebuffer;
    target: number;
    textures: Texture[];
    texture: Texture;
    depthTexture: Texture;
    depthBuffer: WebGLRenderbuffer;
    stencilBuffer: WebGLRenderbuffer;
    depthStencilBuffer: WebGLRenderbuffer;
    constructor(
        gl: OGLRenderingContext,
        {
            width,
            height,
            target,
            color, // number of color attachments
            depth,
            stencil,
            depthTexture, // note - stencil breaks
            wrapS,
            wrapT,
            minFilter,
            magFilter,
            type,
            format,
            internalFormat,
            unpackAlignment,
            premultiplyAlpha,
        }?: Partial<RenderTargetOptions>
    );
    setSize(width: number, height: number): void;
}
