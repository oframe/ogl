import { RenderTarget } from '../core/RenderTarget.js';
import { Mesh } from '../core/Mesh.js';
import { Vec2 } from '../math/Vec2.js';

import type { OGLRenderingContext } from '../core/Renderer.js';

export interface FlowmapOptions {
    size: number;
    falloff: number;
    alpha: number;
    dissipation: number;
    type: number;
}

/**
 * Mouse flowmap.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js | Source}
 */
export class Flowmap {
    gl: OGLRenderingContext;

    uniform: { value: RenderTarget['texture'] | null };

    mask: {
        read: RenderTarget;
        write: RenderTarget;
        swap: () => void;
    };

    aspect: number;
    mouse: Vec2;
    velocity: Vec2;

    mesh: Mesh;

    constructor(gl: OGLRenderingContext, options?: Partial<FlowmapOptions>);

    update(): void;
}
