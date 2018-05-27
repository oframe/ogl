import {Transform} from './Transform.js';

export class Mesh extends Transform {
    constructor(gl, {
        geometry,
        program,
        mode = gl.TRIANGLES,
    } = {}) {
        super(gl);
        this.gl = gl;

        this.geometry = geometry;
        this.program = program;
        this.mode = mode;

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
     } = {}) {
        this.onBeforeRender && this.onBeforeRender({mesh: this, camera});

        // Set the matrix uniforms
        if (camera) {
            this.program.uniforms.projectionMatrix.value = camera.projectionMatrix;
            this.program.uniforms.cameraPosition.value = camera.position;
            this.program.uniforms.viewMatrix.value = camera.viewMatrix;

            this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
            this.normalMatrix.getNormalMatrix(this.modelViewMatrix);

            this.program.uniforms.modelMatrix.value = this.modelMatrix;
            this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix;
            this.program.uniforms.normalMatrix.value = this.normalMatrix;
        }

        // determine if faces need to be flipped - when mesh scaled negatively
        let flipFaces = this.program.cullFace && this.worldMatrix.determinant() < 0;

        // Check here if any bindings can be skipped. Geometry also needs to be rebound if different program
        const programActive = this.gl.renderer.currentProgram === this.program.id;
        const geometryBound = programActive && this.gl.renderer.currentGeometry === this.geometry.id;

        this.program.use({programActive, flipFaces});
        this.geometry.draw({mode: this.mode, program: this.program, geometryBound});

        this.onAfterRender && this.onAfterRender({mesh: this, camera});
    }
}