import { Vec3 } from '../math/Vec3.js';

const tempVec3 = /* @__PURE__ */ new Vec3();
let ID = 1;

const OBJECT_UBO_SIZE = 320;

export class Renderer {
    constructor(device, { canvas, width = 300, height = 150, dpr = 1, alpha = false, autoClear = true, depth = true, stencil = false } = {}) {
        this.device = device;
        this.canvas = canvas;
        this.dpr = dpr;
        this.alpha = alpha;
        this.color = true;
        this.depth = depth;
        this.stencil = stencil;
        this.autoClear = autoClear;
        this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
        this.scissor = null;
        this.id = ID++;

        // Configure canvas context
        this.context = canvas.getContext('webgpu');
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device,
            format: this.presentationFormat,
            alphaMode: alpha ? 'premultiplied' : 'opaque',
        });

        // Pre-compute canvas color formats array and key (reused every frame for non-RT renders)
        this._canvasColorFormats = [this.presentationFormat];
        this._canvasColorFormatsKey = this.presentationFormat;

        // Depth texture (recreated on resize)
        this.depthTexture = null;
        this.depthFormat = 'depth24plus';
        if (stencil) this.depthFormat = 'depth24plus-stencil8';

        // Dynamic per-object uniform buffer (shared across all meshes)
        this._initDynamicUBO();

        // Render state tracking (reset per render call) to skip redundant GPU calls
        this._renderState = { pipeline: null, geometry: null, program: null };
        this._renderPassId = 0;

        // Pre-allocate reusable render list arrays to avoid per-frame allocation
        this._renderList = [];
        this._opaque = [];
        this._transparent = [];
        this._ui = [];

        // Pre-allocate pass descriptor objects (reused each frame for canvas rendering)
        this._canvasColorAttachment = {
            view: null,
            clearValue: this.clearColor,
            loadOp: 'clear',
            storeOp: 'store',
        };
        this._canvasColorAttachments = [this._canvasColorAttachment];
        this._canvasDepthAttachment = {
            view: null,
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        };
        if (stencil) {
            this._canvasDepthAttachment.stencilClearValue = 0;
            this._canvasDepthAttachment.stencilLoadOp = 'clear';
            this._canvasDepthAttachment.stencilStoreOp = 'store';
        }
        this._passDescriptor = {
            colorAttachments: null,
            depthStencilAttachment: undefined,
        };

        // Pre-allocate submit array
        this._submitArray = [null];

        // Reusable draw args object
        this._drawArgs = { camera: null, passEncoder: null };

        this.setSize(width, height);
    }

    _initDynamicUBO() {
        const minAlign = this.device.limits.minUniformBufferOffsetAlignment || 256;
        this._objectUBOAlignedSize = Math.ceil(OBJECT_UBO_SIZE / minAlign) * minAlign;
        this._dynamicUBOCapacity = 0;
        this._dynamicUBO = null;
        this._dynamicUBOData = null;
        this._dynamicUBOOffset = 0;

        this._objectBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: OBJECT_UBO_SIZE },
            }],
        });
        this._objectBindGroup = null;
    }

    _ensureDynamicUBO(count) {
        const needed = count * this._objectUBOAlignedSize;
        if (this._dynamicUBO && this._dynamicUBOCapacity >= needed) {
            this._dynamicUBOOffset = 0;
            return;
        }

        if (this._dynamicUBO) this._dynamicUBO.destroy();
        this._dynamicUBOCapacity = Math.max(needed, 256 * this._objectUBOAlignedSize);
        this._dynamicUBO = this.device.createBuffer({
            size: this._dynamicUBOCapacity,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._dynamicUBOData = new Float32Array(this._dynamicUBOCapacity / 4);
        this._dynamicUBOOffset = 0;

        this._objectBindGroup = this.device.createBindGroup({
            layout: this._objectBindGroupLayout,
            entries: [{ binding: 0, resource: { buffer: this._dynamicUBO, size: OBJECT_UBO_SIZE } }],
        });
    }

    static async create({
        canvas = document.createElement('canvas'),
        width = 300,
        height = 150,
        dpr = 1,
        alpha = false,
        autoClear = true,
        depth = true,
        stencil = false,
        powerPreference = 'high-performance',
    } = {}) {
        if (!navigator.gpu) throw new Error('WebGPU not supported');

        const adapter = await navigator.gpu.requestAdapter({ powerPreference });
        if (!adapter) throw new Error('No GPU adapter found');

        const requiredFeatures = [];
        if (adapter.features.has('float32-filterable')) requiredFeatures.push('float32-filterable');
        if (adapter.features.has('texture-compression-bc')) requiredFeatures.push('texture-compression-bc');
        if (adapter.features.has('texture-compression-etc2')) requiredFeatures.push('texture-compression-etc2');
        if (adapter.features.has('texture-compression-astc')) requiredFeatures.push('texture-compression-astc');
        const device = await adapter.requestDevice({ requiredFeatures });

        const renderer = new Renderer(device, { canvas, width, height, dpr, alpha, autoClear, depth, stencil });

        // Attach renderer reference for classes that receive `gpu` (which is the renderer)
        renderer.renderer = renderer;

        return renderer;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        const pixelWidth = Math.floor(width * this.dpr);
        const pixelHeight = Math.floor(height * this.dpr);

        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;

        if (this.canvas.style) {
            Object.assign(this.canvas.style, {
                width: width + 'px',
                height: height + 'px',
            });
        }

        // Recreate depth texture at new size
        if (this.depth || this.stencil) {
            if (this.depthTexture) this.depthTexture.destroy();
            this.depthTexture = this.device.createTexture({
                size: [pixelWidth, pixelHeight],
                format: this.depthFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
    }

    sortOpaque(a, b) {
        if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
        if (a.program.id !== b.program.id) return a.program.id - b.program.id;
        if (a.zDepth !== b.zDepth) return a.zDepth - b.zDepth;
        return b.id - a.id;
    }

    sortTransparent(a, b) {
        if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
        if (a.zDepth !== b.zDepth) return b.zDepth - a.zDepth;
        return b.id - a.id;
    }

    sortUI(a, b) {
        if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
        if (a.program.id !== b.program.id) return a.program.id - b.program.id;
        return b.id - a.id;
    }

    getRenderList(scene, camera, frustumCull, sort) {
        const renderList = this._renderList;
        renderList.length = 0;

        if (camera && frustumCull) camera.updateFrustum();

        scene.traverse((node) => {
            if (!node.visible) return true;
            if (!node.draw) return;

            if (frustumCull && node.frustumCulled && camera) {
                if (!camera.frustumIntersectsMesh(node)) return;
            }

            renderList.push(node);
        });

        if (sort) {
            const opaque = this._opaque;
            const transparent = this._transparent;
            const ui = this._ui;
            opaque.length = 0;
            transparent.length = 0;
            ui.length = 0;

            for (let i = 0, l = renderList.length; i < l; i++) {
                const node = renderList[i];
                if (!node.program.transparent) {
                    opaque.push(node);
                } else if (node.program.depthTest) {
                    transparent.push(node);
                } else {
                    ui.push(node);
                }

                node.zDepth = 0;

                if (node.renderOrder !== 0 || !node.program.depthTest || !camera) continue;

                node.worldMatrix.getTranslation(tempVec3);
                tempVec3.applyMatrix4(camera.projectionViewMatrix);
                node.zDepth = tempVec3.z;
            }

            opaque.sort(this.sortOpaque);
            transparent.sort(this.sortTransparent);
            ui.sort(this.sortUI);

            // Rebuild renderList in-place: opaque, then transparent, then ui
            renderList.length = 0;
            for (let i = 0, l = opaque.length; i < l; i++) renderList.push(opaque[i]);
            for (let i = 0, l = transparent.length; i < l; i++) renderList.push(transparent[i]);
            for (let i = 0, l = ui.length; i < l; i++) renderList.push(ui[i]);
        }

        return renderList;
    }

    render({ scene, camera, target = null, update = true, sort = true, frustumCull = true, clear }) {
        let colorAttachments;
        let depthStencilAttachment;
        let width, height;

        const shouldClear = clear || (this.autoClear && clear !== false);

        // Expose current render target so Mesh.draw can determine formats
        this.currentTarget = target;

        if (target === null) {
            // Render to canvas — reuse pre-allocated descriptor objects
            const colorTexture = this.context.getCurrentTexture();
            width = colorTexture.width;
            height = colorTexture.height;

            const ca = this._canvasColorAttachment;
            ca.view = colorTexture.createView();
            ca.clearValue = this.clearColor;
            ca.loadOp = shouldClear ? 'clear' : 'load';
            colorAttachments = this._canvasColorAttachments;

            if (this.depthTexture) {
                const da = this._canvasDepthAttachment;
                da.view = this.depthTexture.createView();
                da.depthLoadOp = shouldClear ? 'clear' : 'load';
                if (this.stencil) {
                    da.stencilLoadOp = shouldClear ? 'clear' : 'load';
                }
                depthStencilAttachment = da;
            }
        } else {
            // Render to target
            const passDesc = target.getPassDescriptor({ clear: shouldClear, clearColor: this.clearColor });
            colorAttachments = passDesc.colorAttachments;
            depthStencilAttachment = passDesc.depthStencilAttachment;
            width = target.width;
            height = target.height;
        }

        // Update scene graph matrices
        if (update) scene.updateMatrixWorld();
        if (camera) camera.updateMatrixWorld();

        // Get render list (uses pre-allocated arrays internally)
        const renderList = this.getRenderList(scene, camera, frustumCull, sort);

        // Prepare dynamic UBO for per-object uniforms
        this._ensureDynamicUBO(renderList.length);

        // Reset render state tracking
        this._renderState.pipeline = null;
        this._renderState.geometry = null;
        this._renderState.program = null;
        this._renderPassId++;

        // Pre-compute per-pass format info for Mesh.draw to use
        if (target) {
            this._currentColorFormats = target.colorFormats;
            this._currentColorFormatsKey = target.colorFormatsKey;
            this._currentDepthFormat = (target.depth || target.stencil) ? target.depthFormat : null;
        } else {
            this._currentColorFormats = this._canvasColorFormats;
            this._currentColorFormatsKey = this._canvasColorFormatsKey;
            this._currentDepthFormat = this.depthTexture ? this.depthFormat : null;
        }

        // Create command encoder and render pass
        const commandEncoder = this.device.createCommandEncoder();
        const passDescriptor = this._passDescriptor;
        passDescriptor.colorAttachments = colorAttachments;
        passDescriptor.depthStencilAttachment = depthStencilAttachment;

        const passEncoder = commandEncoder.beginRenderPass(passDescriptor);
        passEncoder.setViewport(0, 0, width, height, 0, 1);
        if (this.scissor) {
            passEncoder.setScissorRect(this.scissor.x, this.scissor.y, this.scissor.width, this.scissor.height);
        }

        const drawArgs = this._drawArgs;
        drawArgs.camera = camera;
        drawArgs.passEncoder = passEncoder;
        for (let i = 0, l = renderList.length; i < l; i++) {
            renderList[i].draw(drawArgs);
        }

        passEncoder.end();

        // Upload all per-object uniform data in one call
        if (this._dynamicUBOOffset > 0) {
            this.device.queue.writeBuffer(this._dynamicUBO, 0, this._dynamicUBOData, 0, this._dynamicUBOOffset / 4);
        }

        this._submitArray[0] = commandEncoder.finish();
        this.device.queue.submit(this._submitArray);
    }
}
