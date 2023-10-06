import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface CylinderOptions {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
    thetaStart: number;
    thetaLength: number;
    attributes: AttributeMap;
}

/**
 * A cylinder geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Cylinder.js | Source}
 */
export class Cylinder extends Geometry {
    constructor(gl: OGLRenderingContext, options?: Partial<CylinderOptions>);
}
