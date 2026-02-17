import { Transform } from './Transform.js';
import { Mat3 } from '../math/Mat3.js';
import { Mat4 } from '../math/Mat4.js';

let ID = 0;

export class Mesh extends Transform {
    constructor(gpu, { geometry, program, mode, frustumCulled = true, renderOrder = 0 } = {}) {
        super();
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        this.id = ID++;
        this.geometry = geometry;
        this.program = program;
        this.mode = mode;

        this.frustumCulled = frustumCulled;
        this.renderOrder = renderOrder;
        this.modelViewMatrix = new Mat4();
        this.normalMatrix = new Mat3();
        this.beforeRenderCallbacks = [];
        this.afterRenderCallbacks = [];
    }

    onBeforeRender(f) {
        this.beforeRenderCallbacks.push(f);
        return this;
    }

    onAfterRender(f) {
        this.afterRenderCallbacks.push(f);
        return this;
    }

    draw({ camera, passEncoder } = {}) {
        let dynamicOffset = 0;

        if (camera) {
            this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
            this.normalMatrix.getNormalMatrix(this.worldMatrix);

            // Pack per-object data directly into the renderer's shared dynamic UBO
            const renderer = this.renderer;
            dynamicOffset = renderer._dynamicUBOOffset;
            const floatOffset = dynamicOffset / 4;
            const data = renderer._dynamicUBOData;

            data.set(this.worldMatrix, floatOffset);               // modelMatrix at 0
            data.set(camera.viewMatrix, floatOffset + 16);         // viewMatrix at 64 bytes
            data.set(this.modelViewMatrix, floatOffset + 32);      // modelViewMatrix at 128 bytes
            data.set(camera.projectionMatrix, floatOffset + 48);   // projectionMatrix at 192 bytes

            // normalMatrix (mat3 packed as 3 x vec4-aligned columns) at 256 bytes = 64 floats
            const nm = this.normalMatrix;
            data[floatOffset + 64] = nm[0];
            data[floatOffset + 65] = nm[1];
            data[floatOffset + 66] = nm[2];
            data[floatOffset + 68] = nm[3];
            data[floatOffset + 69] = nm[4];
            data[floatOffset + 70] = nm[5];
            data[floatOffset + 72] = nm[6];
            data[floatOffset + 73] = nm[7];
            data[floatOffset + 74] = nm[8];

            // cameraPosition (vec3) at 304 bytes = 76 floats
            data[floatOffset + 76] = camera.worldPosition[0];
            data[floatOffset + 77] = camera.worldPosition[1];
            data[floatOffset + 78] = camera.worldPosition[2];

            renderer._dynamicUBOOffset += renderer._objectUBOAlignedSize;
        }

        this.beforeRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));

        // Get pipeline (requires vertex layouts and render target formats)
        const target = this.renderer.currentTarget;
        const colorFormats = target ? target.textures.map((t) => t.format) : [this.renderer.presentationFormat];
        const depthFormat = target
            ? target.depth || target.stencil
                ? target.depthFormat
                : null
            : this.renderer.depthTexture
              ? this.renderer.depthFormat
              : null;

        const pipeline = this.program.getPipeline(
            this.geometry.getVertexBufferLayouts(),
            colorFormats,
            depthFormat,
            camera ? this.renderer._objectBindGroupLayout : null,
            this.geometry.getLayoutKey(),
            this.geometry.attributes.index?.indexFormat
        );

        // Render state tracking — skip redundant setPipeline
        const renderState = this.renderer._renderState;
        if (renderState.pipeline !== pipeline) {
            passEncoder.setPipeline(pipeline);
            renderState.pipeline = pipeline;
        }

        // Material uniforms and bind group 0
        this.program.use({ passEncoder, renderState });

        // Per-object bind group 1 with dynamic offset
        if (camera) {
            passEncoder.setBindGroup(1, this.renderer._objectBindGroup, [dynamicOffset]);
        }

        this.geometry.draw({ passEncoder, renderState });

        this.afterRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
    }
}
