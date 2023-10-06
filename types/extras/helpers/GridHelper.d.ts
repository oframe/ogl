import { Mesh } from '../../core/Mesh.js';

import type { OGLRenderingContext } from '../../core/Renderer.js';
import type { Color } from '../../math/Color.js';

export interface GridHelperOptions {
    size: number;
    divisions: number;
    color: Color;
}

/**
 * Grid helper.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/helpers/GridHelper.js | Source}
 */
export class GridHelper extends Mesh {
    constructor(gl: OGLRenderingContext, options?: Partial<GridHelperOptions>);
}
