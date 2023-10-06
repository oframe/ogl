import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';

export interface BoxOptions {
    width: number;
    height: number;
    depth: number;
    widthSegments: number;
    heightSegments: number;
    depthSegments: number;
    attributes: AttributeMap;
}

/**
 * A box geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Box.js | Source}
 */
export class Box extends Geometry {
    constructor(gl: OGLRenderingContext, options?: Partial<BoxOptions>);
}
