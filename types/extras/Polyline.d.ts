import { Geometry } from '../core/Geometry.js';
import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Color } from '../math/Color.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface PolylineOptions {
    points: Vec3[];
    vertex: string;
    fragment: string;
    uniforms: Record<string, any>;
    attributes: AttributeMap;
}

/**
 * A polyline mesh.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Polyline.js | Source}
 */
export class Polyline {
    gl: OGLRenderingContext;
    points: Vec3[];
    count: number;

    position: Float32Array;
    prev: Float32Array;
    next: Float32Array;

    geometry: Geometry;

    resolution: { value: Vec2 };
    dpr: { value: number };
    thickness: { value: number };
    color: { value: Color };
    miter: { value: number };

    program: Program;

    mesh: Mesh;

    constructor(gl: OGLRenderingContext, options?: Partial<PolylineOptions>);

    updateGeometry(): void;

    resize(): void;
}
