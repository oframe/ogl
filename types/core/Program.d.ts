import type { OGLRenderingContext, BlendFunc, BlendEquation } from './Renderer';

export interface ProgramOptions {
    vertex: string;
    fragment: string;
    uniforms: Record<string, any>;

    transparent: boolean;
    cullFace: GLenum | false | null;
    frontFace: GLenum;
    depthTest: boolean;
    depthWrite: boolean;
    depthFunc: GLenum;
}

export interface UniformInfo extends WebGLActiveInfo {
    uniformName: string;
    nameComponents: string[];
    isStruct: boolean;
    isStructArray: boolean;
    structIndex: number;
    structProperty: string;
}

/**
 * A WebGL program.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Program.js | Source}
 */
export class Program {
    gl: OGLRenderingContext;
    uniforms: Record<string, any>;
    id: number;

    transparent: boolean;
    cullFace: GLenum | false | null;
    frontFace: GLenum;
    depthTest: boolean;
    depthWrite: boolean;
    depthFunc: GLenum;
    blendFunc: BlendFunc;
    blendEquation: BlendEquation;

    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    program: WebGLProgram;
    uniformLocations: Map<UniformInfo, WebGLUniformLocation>;
    attributeLocations: Map<WebGLActiveInfo, GLint>;
    attributeOrder: string;

    constructor(gl: OGLRenderingContext, options?: Partial<ProgramOptions>);

    setShaders(options: { vertex: string; fragment: string }): void;

    setBlendFunc(src: GLenum, dst: GLenum, srcAlpha?: GLenum, dstAlpha?: GLenum): void;

    setBlendEquation(modeRGB: GLenum, modeAlpha: GLenum): void;

    applyState(): void;

    use(options?: { flipFaces?: boolean }): void;

    remove(): void;
}
