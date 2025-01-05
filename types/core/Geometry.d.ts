import { Vec3 } from '../math/Vec3.js';

import type { OGLRenderingContext, RenderState } from './Renderer.js';
import type { Program } from './Program.js';

export type AttributeMap = Record<string, Partial<Attribute>>;

export type AttributeData =
    | Float32Array
    | Uint32Array
    | Uint16Array
    | Int16Array
    | Uint8Array
    | Int8Array;

export interface Attribute {
    data: AttributeData;
    size: number;
    instanced: null | number | boolean;
    type: GLenum;
    normalized: boolean;

    buffer: WebGLBuffer;
    stride: number;
    offset: number;
    count: number;
    target: number;
    id: number;
    divisor: number;
    needsUpdate: boolean;
    usage: number;
}

export interface Bounds {
    min: Vec3;
    max: Vec3;
    center: Vec3;
    scale: Vec3;
    radius: number;
}

export type GeometryRaycast = 'sphere' | 'box';

/**
 * A mesh, line, or point geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/core/Geometry.js | Source}
 */
export class Geometry {
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

    // Set from gltf loader
    extras?: Record<string, any>;
    extensions?: Record<string, any>;

    raycast?: GeometryRaycast; // User defined

    constructor(gl: OGLRenderingContext, attributes?: AttributeMap);

    addAttribute(key: string, attr: Partial<Attribute>): number | undefined;

    updateAttribute(attr: Partial<Attribute>): void;

    setIndex(attr: Partial<Attribute>): void;

    setDrawRange(start: number, count: number): void;

    setInstancedCount(value: number): void;

    createVAO(program: Program): void;

    bindAttributes(program: Program): void;

    draw(options: { program: Program; mode?: number }): void;

    getPosition(): Partial<Attribute>;

    computeBoundingBox(attr?: Partial<Attribute>): void;

    computeBoundingSphere(attr?: Partial<Attribute>): void;

    remove(): void;
}
