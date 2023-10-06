import { Transform } from '../core/Transform.js';
import { Mesh } from '../core/Mesh.js';
import { Vec4 } from '../math/Vec4.js';

export class InstancedMesh extends Mesh {
    constructor(...args) {
        super(...args);

        // Skip renderer frustum culling
        this.frustumCulled = false;
        this.isInstancedMesh = true;
    }

    addFrustumCull() {
        this.instanceTransforms = null;
        this.instanceLightmapScaleOffset = null;
        this.totalInstanceCount = 0;
        this.frustumCullFunction = null;
        this.instanceRenderList = null;

        // Get instanced mesh
        if (!this.geometry.attributes.instanceMatrix)
            console.error(`mesh ${this.name ? `"${this.name}" ` : ``}missing instanceMatrix attribute; unable to frustum cull`);

        // Make list of transforms from instanceMatrix
        const matrixData = this.geometry.attributes.instanceMatrix.data;
        this.instanceTransforms = [];
        for (let i = 0, j = 0; i < matrixData.length; i += 16, j++) {
            const transform = new Transform();
            transform.index = j;
            transform.matrix.fromArray(matrixData, i);
            transform.decompose();
            this.instanceTransforms.push(transform);
            // Add transforms to parent to update world matrices
            transform.setParent(this.parent);
        }
        this.totalInstanceCount = this.instanceTransforms.length;

        // Check for lightmap attributes - attach to transform
        if (!!this.geometry.attributes.lightmapScaleOffset) {
            const lightmapData = this.geometry.attributes.lightmapScaleOffset.data;
            for (let i = 0, j = 0; i < lightmapData.length; i += 4, j++) {
                this.instanceTransforms[j].lightmapData = new Vec4().fromArray(lightmapData, i);
            }
        }

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

                // Update lightmap attr
                if (transform.lightmapData) {
                    transform.lightmapData.toArray(this.geometry.attributes.lightmapScaleOffset.data, i * 4);
                    this.geometry.attributes.lightmapScaleOffset.needsUpdate = true;
                }
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

            // Update lightmap attr
            if (transform.lightmapData) {
                transform.lightmapData.toArray(this.geometry.attributes.lightmapScaleOffset.data, i * 4);
                this.geometry.attributes.lightmapScaleOffset.needsUpdate = true;
            }
        });
        this.geometry.attributes.instanceMatrix.needsUpdate = true;
    }
}
