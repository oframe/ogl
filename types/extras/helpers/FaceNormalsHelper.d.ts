import { Mesh } from '../../core/Mesh.js';

import type { Color } from '../../math/Color.js';

export interface FaceNormalsHelperOptions {
    size: number;
    color: Color;
}

/**
 * Face normals helper.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/helpers/FaceNormalsHelper.js | Source}
 */
export class FaceNormalsHelper extends Mesh {
    constructor(object: Mesh, options?: Partial<FaceNormalsHelperOptions>);
}
