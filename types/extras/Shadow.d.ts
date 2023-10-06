import { Camera } from '../core/Camera.js';
import { Program } from '../core/Program.js';
import { RenderTarget } from '../core/RenderTarget.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Transform } from '../core/Transform.js';
import type { Mesh } from '../core/Mesh.js';

export interface ShadowOptions {
    light: Camera;
    width: number;
    height: number;
}

/**
 * Shadow map.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Shadow.js | Source}
 */
export class Shadow {
    gl: OGLRenderingContext;

    light: Camera;

    target: RenderTarget;
    targetUniform: { value: RenderTarget['texture'] | null };

    depthProgram: Program;

    castMeshes: Mesh[];

    constructor(gl: OGLRenderingContext, options?: Partial<ShadowOptions>);

    add(options: {
        mesh: Mesh;
        receive?: boolean;
        cast?: boolean;
        vertex?: string;
        fragment?: string;
        uniformProjection?: string;
        uniformView?: string;
        uniformTexture?: string;
    }): void;

    setSize(options: { width?: number; height?: number }): void;

    render(options: { scene: Transform }): void;
}
