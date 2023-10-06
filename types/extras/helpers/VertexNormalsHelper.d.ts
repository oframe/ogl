import { Mesh } from '../../core/Mesh.js';

import type { Color } from '../../math/Color.js';

export interface VertexNormalsHelperOptions {
    size: number;
    color: Color;
}

/**
 * Vertex normals helper.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/helpers/VertexNormalsHelper.js | Source}
 */
export class VertexNormalsHelper extends Mesh {
    constructor(object: Mesh, options?: Partial<VertexNormalsHelperOptions>);
}
