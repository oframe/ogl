import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface PlaneOptions {
    width: number;
    height: number;
    widthSegments: number;
    heightSegments: number;
    attributes: AttributeMap;
}

/**
 * A plane geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Plane.js | Source}
 */
export class Plane extends Geometry {
    constructor(gl: OGLRenderingContext, options?: Partial<PlaneOptions>);

    static buildPlane(
        position: Float32Array,
        normal: Float32Array,
        uv: Float32Array,
        index: Uint32Array | Uint16Array,
        width: number,
        height: number,
        depth: number,
        wSegs: number,
        hSegs: number,
        u: number,
        v: number,
        w: number,
        uDir: number,
        vDir: number,
        i: number,
        ii: number,
    ): void;
}
