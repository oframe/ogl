import { Mesh } from '../../core/Mesh.js';

import type { OGLRenderingContext } from '../../core/Renderer.js';
import type { Color } from '../../math/Color.js';

export interface AxesHelperOptions {
    size: number;
    symmetric: boolean;
    xColor: Color;
    yColor: Color;
    zColor: Color;
}

/**
 * Axes helper.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/helpers/AxesHelper.js | Source}
 */
export class AxesHelper extends Mesh {
    constructor(gl: OGLRenderingContext, options?: Partial<AxesHelperOptions>);
}
