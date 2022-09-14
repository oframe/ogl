import { Transform } from '../core/Transform.js';
import { Mesh } from '../core/Mesh.js';

export class InstancedMesh extends Mesh {
    constructor(...args) {
        super(...args);

        // Skip renderer frustum culling
        this.frustumCulled = false;
        this.isInstancedMesh = true;
    }

    addFrustumCull() {
        this.instanceTransforms = null;
        this.totalInstanceCount = 0;
        this.frustumCullFunction = null;
        this.instanceRenderList = null;

        // Get instanced mesh
        if (!this.geometry.attributes.instanceMatrix)
            console.error(`mesh ${this.name ? `"${this.name}" ` : ``}missing instanceMatrix attribute; unable to frustum cull`);

        // Make list of transforms from instanceMatrix
        const matrixData = this.geometry.attributes.instanceMatrix.data;
        this.instanceTransforms = [];
        for (let i = 0; i < matrixData.length; i += 16) {
            const transform = new Transform();
            transform.matrix.fromArray(matrixData, i);
            transform.decompose();
            this.instanceTransforms.push(transform);
            // Add transforms to parent to update world matrices
            transform.setParent(this.parent);
        }
        this.totalInstanceCount = this.instanceTransforms.length;

        this.frustumCullFunction = ({ camera }) => {
            // frustum cull transforms each frame - pass world matrix
            this.instanceRenderList = [];
            this.instanceTransforms.forEach((transform) => {
                if (!camera.frustumIntersectsMesh(this, transform.worldMatrix)) return;
                this.instanceRenderList.push(transform);
            });

            // update instanceMatrix and instancedCount with visible
            this.instanceRenderList.forEach((transform, i) => {
                transform.matrix.toArray(this.geometry.attributes.instanceMatrix.data, i * 16);
            });
            this.geometry.instancedCount = this.instanceRenderList.length;
            this.geometry.attributes.instanceMatrix.needsUpdate = true;
        };

        this.onBeforeRender(this.frustumCullFunction);
    }

    removeFrustumCull() {
        this.offBeforeRender(this.frustumCullFunction);
        this.geometry.instancedCount = this.totalInstanceCount;
        this.instanceTransforms.forEach((transform, i) => {
            transform.matrix.toArray(this.geometry.attributes.instanceMatrix.data, i * 16);
        });
        this.geometry.attributes.instanceMatrix.needsUpdate = true;
    }
}
