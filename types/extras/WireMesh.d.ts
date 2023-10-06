import { Mesh } from '../core/Mesh.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Color } from '../math/Color.js';
import type { MeshOptions } from '../core/Mesh.js';

export interface WireMeshOptions extends MeshOptions {
    wireColor: Color;
}

/**
 * A wireframe mesh.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/WireMesh.js | Source}
 */
export class WireMesh extends Mesh {
    constructor(gl: OGLRenderingContext, options?: Partial<WireMeshOptions>);
}
