import { Camera } from './Camera.js';
import { Mesh } from './Mesh.js';
import { Transform } from './Transform.js';
import { RenderTarget } from './RenderTarget.js';

export declare type OGLRenderingContext = {
    renderer: Renderer;
    canvas: HTMLCanvasElement;
} & (WebGL2RenderingContext | WebGLRenderingContext);

export interface RendererOptions {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    dpr: number;
    alpha: boolean;
    depth: boolean;
    stencil: boolean;
    antialias: boolean;
    premultipliedAlpha: boolean;
    preserveDrawingBuffer: boolean;
    powerPreference: string;
    autoClear: boolean;
    webgl: number;
}

export interface DeviceParameters {
    maxTextureUnits?: number;
    maxAnisotropy?: number;
}

export interface BlendFunc {
    src: GLenum;
    dst: GLenum;
    srcAlpha?: GLenum;
    dstAlpha?: GLenum;
}

export interface BlendEquation {
    modeRGB: GLenum;
    modeAlpha?: GLenum;
}

export interface Viewport {
    x: number;
    y: number;
    width: number | null;
    height: number | null;
}

export interface RenderState {
    blendFunc: BlendFunc;
    blendEquation: BlendEquation;
    cullFace: number | null;
    frontFace: number;
    depthMask: boolean;
    depthFunc: number;
    premultiplyAlpha: boolean;
    flipY: boolean;
    unpackAlignment: number;
    viewport: Viewport;
    textureUnits: number[];
    activeTextureUnit: number;
    framebuffer: WebGLFramebuffer | null;
    boundBuffer?: WebGLBuffer | null;
    uniformLocations: Map<WebGLUniformLocation, number | number[]>;
    currentProgram: number | null;
}

export interface RenderExtensions {
    [key: string]: any;
}

export interface RendererSortable extends Mesh {
    zDepth: number;
}

export declare class Renderer {
    dpr: number;
    alpha: boolean;
    color: boolean;
    depth: boolean;
    stencil: boolean;
    premultipliedAlpha: boolean;
    autoClear: boolean;
    id: number;
    gl: OGLRenderingContext;
    isWebgl2: boolean;
    state: RenderState;
    extensions: RenderExtensions;
    vertexAttribDivisor: Function;
    drawArraysInstanced: Function;
    drawElementsInstanced: Function;
    createVertexArray: Function;
    bindVertexArray: Function;
    deleteVertexArray: Function;
    drawBuffers: Function;
    parameters: DeviceParameters;
    width: number;
    height: number;
    currentGeometry?: string | null;
    constructor({
        canvas,
        width,
        height,
        dpr,
        alpha,
        depth,
        stencil,
        antialias,
        premultipliedAlpha,
        preserveDrawingBuffer,
        powerPreference,
        autoClear,
        webgl,
    }?: {
        canvas?: HTMLCanvasElement | undefined;
        width?: number | undefined;
        height?: number | undefined;
        dpr?: number | undefined;
        alpha?: boolean | undefined;
        depth?: boolean | undefined;
        stencil?: boolean | undefined;
        antialias?: boolean | undefined;
        premultipliedAlpha?: boolean | undefined;
        preserveDrawingBuffer?: boolean | undefined;
        powerPreference?: string | undefined;
        autoClear?: boolean | undefined;
        webgl?: number | undefined;
    });
    setSize(width: number, height: number): void;
    setViewport(width: number, height: number, x?: number, y?: number): void;
    setScissor(width: number, height: number, x?: number, y?: number): void;
    enable(id: GLenum): void;
    disable(id: GLenum): void;
    setBlendFunc(src: GLenum, dst: GLenum, srcAlpha: GLenum, dstAlpha: GLenum): void;
    setBlendEquation(modeRGB: GLenum, modeAlpha: GLenum): void;
    setCullFace(value: GLenum): void;
    setFrontFace(value: GLenum): void;
    setDepthMask(value: GLboolean): void;
    setDepthFunc(value: GLenum): void;
    activeTexture(value: number): void;
    bindFramebuffer({ target, buffer }?: { target?: GLenum; buffer?: WebGLFramebuffer | null }): void;
    getExtension(extension: string, webgl2Func?: keyof WebGL2RenderingContext, extFunc?: string): any | null;
    sortOpaque(a: RendererSortable, b: RendererSortable): number;
    sortTransparent(a: RendererSortable, b: RendererSortable): number;
    sortUI(a: RendererSortable, b: RendererSortable): number;
    getRenderList({ scene, camera, frustumCull, sort }: { scene: Transform; camera?: Camera; frustumCull: boolean; sort: boolean }): Mesh[];
    render({
        scene,
        camera,
        target,
        update,
        sort,
        frustumCull,
        clear,
    }: {
        scene: Transform;
        camera?: Camera;
        target?: RenderTarget | null;
        update?: boolean;
        sort?: boolean;
        frustumCull?: boolean;
        clear?: boolean;
    }): void;
}
