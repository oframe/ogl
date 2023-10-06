import { Geometry } from '../core/Geometry.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { AttributeMap } from '../core/Geometry.js';
import type { Path } from './path/Path.js';

export interface TubeOptions {
    path: Path;
    radius: number;
    tubularSegments: number;
    radialSegments: number;
    closed: boolean;
    attributes: AttributeMap;
}

/**
 * A tube geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Tube.js | Source}
 */
export class Tube extends Geometry {
    path: Path;
    radius: number;
    tubularSegments: number;
    radialSegments: number;
    closed: boolean;

    frenetFrames: object;

    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    indices: Uint32Array | Uint16Array;

    constructor(gl: OGLRenderingContext, options?: Partial<TubeOptions>);
}
