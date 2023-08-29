import { Vec3 } from '../math/Vec3.js';
import { OGLRenderingContext, RenderState } from './Renderer.js';
import { Program } from './Program.js';

export interface AttributeMap {
    [key: string]: Partial<Attribute>;
}

export type AttributeData = Float32Array | Uint32Array | Uint16Array;

export interface Attribute {
    size: number;
    data: AttributeData;
    instanced?: null | number | boolean;
    type: GLenum;
    normalized: boolean;
    target?: number;
    id?: number;
    buffer?: WebGLBuffer;
    stride: number;
    offset: number;
    count?: number;
    divisor?: number;
    needsUpdate?: boolean;
    usage?: number;
}

export interface Bounds {
    min: Vec3;
    max: Vec3;
    center: Vec3;
    scale: Vec3;
    radius: number;
}

export declare type GeometryRaycast = 'sphere' | 'box';

export declare class Geometry {
    gl: OGLRenderingContext;
    attributes: AttributeMap;
    id: number;
    VAOs: {
        [programKey: string]: WebGLVertexArrayObject;
    };
    drawRange: {
        start: number;
        count: number;
    };
    instancedCount: number;
    glState: RenderState;
    isInstanced: boolean;
    bounds: Bounds;
    raycast?: GeometryRaycast;
    constructor(gl: OGLRenderingContext, attributes?: AttributeMap);
    addAttribute(key: string, attr: Partial<Attribute>): number | undefined;
    updateAttribute(attr: Partial<Attribute>): void;
    setIndex(value: Attribute): void;
    setDrawRange(start: number, count: number): void;
    setInstancedCount(value: number): void;
    createVAO(program: Program): void;
    bindAttributes(program: Program): void;
    draw({ program, mode }: { program: Program; mode?: number }): void;
    getPosition(): Partial<Attribute>;
    computeBoundingBox(attr: Partial<Attribute>): void;
    computeBoundingSphere(attr?: Partial<Attribute>): void;
    remove(): void;
}
