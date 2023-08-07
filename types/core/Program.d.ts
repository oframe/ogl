import { OGLRenderingContext, BlendFunc, BlendEquation } from './Renderer';

export interface ProgramOptions {
    vertex: string;
    fragment: string;
    uniforms: {
        [name: string]: {
            value: any;
        };
    };
    transparent: boolean;
    cullFace: GLenum | false;
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

export declare class Program {
    gl: OGLRenderingContext;
    uniforms: {
        [name: string]: {
            value: any;
        };
    };
    id: number;
    transparent: boolean;
    cullFace: GLenum | false;
    frontFace: GLenum;
    depthTest: boolean;
    depthWrite: boolean;
    depthFunc: GLenum;
    blendFunc: BlendFunc;
    blendEquation: BlendEquation;
    program: WebGLProgram;
    uniformLocations: Map<UniformInfo, WebGLUniformLocation>;
    attributeLocations: Map<WebGLActiveInfo, GLint>;
    attributeOrder: string;
    constructor(
        gl: OGLRenderingContext,
        { vertex, fragment, uniforms, transparent, cullFace, frontFace, depthTest, depthWrite, depthFunc }?: Partial<ProgramOptions>
    );
    setBlendFunc(src: GLenum, dst: GLenum, srcAlpha?: GLenum, dstAlpha?: GLenum): void;
    setBlendEquation(modeRGB: GLenum, modeAlpha: GLenum): void;
    applyState(): void;
    use({ flipFaces }?: { flipFaces?: boolean }): void;
    remove(): void;
}
