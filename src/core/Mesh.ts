import { Transform } from './Transform';
import { Mat3 } from '../math/Mat3';
import { Mat4 } from '../math/Mat4';
import { Geometry } from './Geometry';
import { Program } from './Program';
import { Camera } from './Camera';

let ID = 0;

export interface MeshOptions {
    geometry: Geometry;
    program: Program;
    mode: GLenum;
    frustumCulled: boolean;
    renderOrder: number;
}

export interface DrawOptions {
    camera: Camera;
}

export interface MeshRenderCallbackOptions {
    mesh: Mesh;
    camera: Camera;
}

export class Mesh extends Transform {
    gl: WebGL2RenderingContext;
    id: number;

    geometry: Geometry;
    program: Program;
    mode: GLenum;
    frustumCulled: boolean;
    renderOrder: number;

    modelViewMatrix = new Mat4();
    normalMatrix = new Mat3();

    onBeforeRender: (options: MeshRenderCallbackOptions) => void;
    onAfterRender: (options: MeshRenderCallbackOptions) => void;

    constructor(gl: WebGL2RenderingContext, {
        geometry,
        program,
        mode = gl.TRIANGLES,
        frustumCulled = true,
        renderOrder = 0,
    }: Partial<MeshOptions> = {}) {
        super();

        this.gl = gl;
        this.id = ID++;

        this.geometry = geometry;
        this.program = program;
        this.mode = mode;

        // Used to skip frustum culling
        this.frustumCulled = frustumCulled;

        // Override sorting to force an order
        this.renderOrder = renderOrder;

        // Add empty matrix uniforms to program if unset
        if (!this.program.uniforms.modelMatrix) {
            Object.assign(this.program.uniforms, {
                modelMatrix: {value: null},
                viewMatrix: {value: null},
                modelViewMatrix: {value: null},
                normalMatrix: {value: null},
                projectionMatrix: {value: null},
                cameraPosition: {value: null},
            });
        }
    }

    draw({
        camera,
    }: Partial<DrawOptions> = {}) {
        this.onBeforeRender && this.onBeforeRender({mesh: this, camera});

        // Set the matrix uniforms
        if (camera) {
            this.program.uniforms.projectionMatrix.value = camera.projectionMatrix;
            this.program.uniforms.cameraPosition.value = camera.position;
            this.program.uniforms.viewMatrix.value = camera.viewMatrix;

            this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
            this.normalMatrix.getNormalMatrix(this.modelViewMatrix);

            this.program.uniforms.modelMatrix.value = this.worldMatrix;
            this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix;
            this.program.uniforms.normalMatrix.value = this.normalMatrix;
        }

        // determine if faces need to be flipped - when mesh scaled negatively
        let flipFaces = this.program.cullFace && this.worldMatrix.determinant() < 0;

        this.program.use({flipFaces});
        this.geometry.draw({mode: this.mode, program: this.program});

        this.onAfterRender && this.onAfterRender({mesh: this, camera});
    }
}