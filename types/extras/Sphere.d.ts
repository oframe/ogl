import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface SphereOptions {
    radius: number;
    widthSegments: number;
    heightSegments: number;
    phiStart: number;
    phiLength: number;
    thetaStart: number;
    thetaLength: number;
    attributes: AttributeMap;
}

/**
 * A sphere geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Sphere.js | Source}
 */
export class Sphere extends Geometry {
    constructor(gl: OGLRenderingContext, options?: Partial<SphereOptions>);
}
