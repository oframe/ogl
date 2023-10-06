import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface TorusOptions {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
    arc: number;
    attributes: AttributeMap;
}

/**
 * A torus geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Torus.js | Source}
 */
export class Torus extends Geometry {
    constructor(gl: OGLRenderingContext, options?: Partial<TorusOptions>);
}
