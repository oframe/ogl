import { Program } from '../core/Program.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { ProgramOptions } from '../core/Program.js';

/**
 * A normal program.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/NormalProgram.js | Source}
 */
export class NormalProgram extends Program {
    constructor(gl: OGLRenderingContext, options?: Partial<ProgramOptions>);
}
