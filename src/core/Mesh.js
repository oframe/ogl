import {Transform} from './Transform.js';
import {Mat3} from '../math/Mat3.js';
import {Mat4} from '../math/Mat4.js';
import {Vec3} from '../math/Vec3.js';

const tempVec3 = new Vec3();

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

        this.modelViewMatrix = new Mat4();
        this.normalMatrix = new Mat3();

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

            this.program.uniforms.modelMatrix.value = this.matrix;
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

    computeBoundingBox(array) {

        // Use position buffer if available
        if (!array && this.geometry.attributes.position) array = this.geometry.attributes.position.data;
        if (!array) console.warn('No position buffer found to compute bounds');

        if (!this.bounds) {
            this.bounds = {
                min: new Vec3(),
                max: new Vec3(),
                center: new Vec3(),
                scale: new Vec3(),
                radius: Infinity,
            };
        }

        const min = this.bounds.min;
        const max = this.bounds.max;
        const center = this.bounds.center;
        const scale = this.bounds.scale;

        min.set(+Infinity);
        max.set(-Infinity);

        for (let i = 0, l = array.length; i < l; i += 3) {
            const x = array[i];
            const y = array[i + 1];
            const z = array[i + 2];

            min.x = Math.min(x, min.x);
            min.y = Math.min(y, min.y);
            min.z = Math.min(z, min.z);

            max.x = Math.max(x, max.x);
            max.y = Math.max(y, max.y);
            max.z = Math.max(z, max.z);
        }

        scale.sub(max, min);
        center.add(min, max).divide(2);

        // This is not an accurate radius - use computeBoundingSphere if accuracy needed
        this.bounds.radius = tempVec3.copy(scale).divide(2).length();
    }

    computeBoundingSphere(array) {

        // Use position buffer if available
        if (!array && this.geometry.attributes.position) array = this.geometry.attributes.position.data;
        if (!array) console.warn('No position buffer found to compute bounds');

        if (!this.bounds) this.computeBoundingBox(array);

        let maxRadiusSq = 0;
        for (let i = 0, l = array.length; i < l; i += 3) {
            tempVec3.fromArray(array, i);
            maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistance(tempVec3));
        }

        this.bounds.radius = Math.sqrt(maxRadiusSq);
    }
}