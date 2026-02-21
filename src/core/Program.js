let ID = 1;

// std140 alignment rules
function align(offset, alignment) {
    return Math.ceil(offset / alignment) * alignment;
}

// Get byte size and alignment for a uniform value
function getUniformInfo(value) {
    if (typeof value === 'number') return { size: 4, alignment: 4 }; // f32
    if (value.length === 2) return { size: 8, alignment: 8 }; // vec2
    if (value.length === 3) return { size: 12, alignment: 16 }; // vec3 (aligned to 16)
    if (value.length === 4) return { size: 16, alignment: 16 }; // vec4
    if (value.length === 9) return { size: 48, alignment: 16 }; // mat3 (3 x vec4-aligned columns)
    if (value.length === 16) return { size: 64, alignment: 16 }; // mat4
    return { size: 4, alignment: 4 };
}

// Pre-allocated view descriptors for bind group texture views
const CUBE_VIEW_DESC = { dimension: 'cube' };
const DEFAULT_VIEW_DESC = {};

export class Program {
    constructor(
        gpu,
        {
            vertex,
            fragment,
            uniforms = {},
            transparent = false,
            cullFace = 'back',
            frontFace = 'ccw',
            depthTest = true,
            depthWrite = true,
            depthFunc = 'less-equal',
            topology = 'triangle-list',
            blendSrc,
            blendDst,
            blendSrcAlpha,
            blendDstAlpha,
            blendEquation = 'add',
            blendEquationAlpha,
            stencil,
            stencilFront,
            stencilBack,
            stencilReadMask = 0xFF,
            stencilWriteMask = 0xFF,
            stencilRef = 0,
        } = {}
    ) {
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        this.uniforms = uniforms;
        this.id = ID++;

        this.transparent = transparent;
        this.cullFace = cullFace;
        this.frontFace = frontFace;
        this.depthTest = depthTest;
        this.depthWrite = depthWrite;
        this.depthFunc = depthFunc;
        this.topology = topology;

        // Blend state
        if (this.transparent && !blendSrc) {
            blendSrc = 'src-alpha';
            blendDst = 'one-minus-src-alpha';
        }
        this.blendSrc = blendSrc;
        this.blendDst = blendDst;
        this.blendSrcAlpha = blendSrc ? (blendSrcAlpha || 'one') : undefined;
        this.blendDstAlpha = blendSrc ? (blendDstAlpha || 'one-minus-src-alpha') : undefined;
        this.blendEquation = blendEquation;
        this.blendEquationAlpha = blendEquationAlpha || blendEquation;

        // Stencil state — `stencil` shorthand applies to both faces
        this.stencilFront = stencilFront || stencil;
        this.stencilBack = stencilBack || stencil;
        this.stencilReadMask = stencilReadMask;
        this.stencilWriteMask = stencilWriteMask;
        this.stencilRef = stencilRef;

        // Pre-compute the immutable portion of the pipeline cache key (blend + stencil)
        // These values never change after construction, so we build the string once
        this._isStrip = this.topology === 'line-strip' || this.topology === 'triangle-strip';

        let immutableKey = '';
        if (this.blendSrc) {
            immutableKey += '|b:' + this.blendSrc + ',' + this.blendDst + ',' + this.blendSrcAlpha + ',' + this.blendDstAlpha + ',' + this.blendEquation + ',' + this.blendEquationAlpha;
        }
        if (this.stencilFront) {
            immutableKey += '|sf:' + this.stencilFront.compare + ',' + (this.stencilFront.failOp || 'keep') + ',' + (this.stencilFront.depthFailOp || 'keep') + ',' + (this.stencilFront.passOp || 'keep');
        }
        if (this.stencilBack) {
            immutableKey += '|sb:' + this.stencilBack.compare + ',' + (this.stencilBack.failOp || 'keep') + ',' + (this.stencilBack.depthFailOp || 'keep') + ',' + (this.stencilBack.passOp || 'keep');
        }
        this._immutablePipelineKey = immutableKey;

        // Pre-compute merged stencil state objects (avoid per-cache-miss spread)
        if (this.stencilFront) {
            this._mergedStencilFront = {
                compare: this.stencilFront.compare || 'always',
                failOp: this.stencilFront.failOp || 'keep',
                depthFailOp: this.stencilFront.depthFailOp || 'keep',
                passOp: this.stencilFront.passOp || 'keep',
            };
        }
        if (this.stencilBack) {
            this._mergedStencilBack = {
                compare: this.stencilBack.compare || 'always',
                failOp: this.stencilBack.failOp || 'keep',
                depthFailOp: this.stencilBack.depthFailOp || 'keep',
                passOp: this.stencilBack.passOp || 'keep',
            };
        }

        // Pre-compute cull mode string
        if (this.cullFace === 'back' || this.cullFace === true) this._cullMode = 'back';
        else if (this.cullFace === 'front') this._cullMode = 'front';
        else this._cullMode = 'none';

        // Pre-compute blend target descriptor (reused for each color target on cache miss)
        if (this.blendSrc) {
            this._blendState = {
                color: { srcFactor: this.blendSrc, dstFactor: this.blendDst, operation: this.blendEquation },
                alpha: { srcFactor: this.blendSrcAlpha, dstFactor: this.blendDstAlpha, operation: this.blendEquationAlpha },
            };
        }

        // Create shader modules
        this.vertexModule = this.device.createShaderModule({ code: vertex });
        this.fragmentModule = this.device.createShaderModule({ code: fragment });

        // Pipeline cache: key -> GPURenderPipeline
        this.pipelineCache = new Map();

        // Uniform buffer layout and staging data
        this.uniformData = null;
        this.uniformLayout = null;

        // Dynamic uniform pool (allows per-draw uniform values for shared programs)
        this._uniformPoolBuffer = null;
        this._uniformPoolCapacity = 0;
        this._uniformPoolOffset = 0;
        this._uniformBufferSize = 0;
        this._uniformAlignedSize = 0;
        this._currentDynamicOffset = 0;
        this._lastRenderPassId = -1;

        // Bind group and layout
        this.bindGroup = null;
        this.bindGroupLayout = null;
        this.pipelineLayout = null;

        // Track textures for bind group
        this.textureEntries = [];

        // Build uniform layout from initial values
        this._buildUniformLayout();
    }

    _buildUniformLayout() {
        const layout = [];
        let offset = 0;
        let hasUniforms = false;

        for (let name in this.uniforms) {
            const uniform = this.uniforms[name];
            if (uniform.value === undefined || uniform.value === null) continue;

            // Skip textures - handled separately
            if (uniform.value.texture || uniform.value._isTexture) continue;

            // Array of vectors/matrices (e.g. uLights: [Vec3, Vec3, ...])
            if (Array.isArray(uniform.value) && uniform.value.length > 0 && uniform.value[0].length !== undefined) {
                const arr = uniform.value;
                const elemInfo = getUniformInfo(arr[0]);
                const elemStride = align(elemInfo.size, 16); // std140: array elements aligned to 16
                offset = align(offset, 16); // array alignment is 16
                layout.push({ name, offset, size: elemStride * arr.length, isArray: true, elemLength: arr[0].length, elemStride, count: arr.length });
                offset += elemStride * arr.length;
                hasUniforms = true;
                continue;
            }

            const value = uniform.value.length !== undefined ? uniform.value : [uniform.value];
            const info = getUniformInfo(value);

            offset = align(offset, info.alignment);

            layout.push({ name, offset, size: info.size, valueLength: value.length || 1 });
            offset += info.size;
            hasUniforms = true;
        }

        // Ensure buffer size is multiple of 16 (WebGPU requirement for uniform buffers)
        if (hasUniforms) {
            const bufferSize = align(offset, 16);
            this.uniformLayout = layout;
            this._uniformLayoutLength = layout.length;
            this.uniformData = new Float32Array(bufferSize / 4);
            this._uniformBufferSize = bufferSize;

            // Compute aligned size for dynamic offset pool
            const minAlign = this.device.limits.minUniformBufferOffsetAlignment || 256;
            this._uniformAlignedSize = Math.ceil(bufferSize / minAlign) * minAlign;
        }

        this._buildBindGroupLayout();
    }

    _buildBindGroupLayout() {
        const entries = [];
        let binding = 0;

        // Uniform buffer at binding 0 (with dynamic offset for per-draw values)
        if (this.uniformLayout) {
            entries.push({
                binding: binding++,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: this._uniformBufferSize },
            });
        }

        // Collect textures
        this.textureEntries = [];
        for (let name in this.uniforms) {
            const uniform = this.uniforms[name];
            if (!uniform.value) continue;
            if (uniform.value._isTexture) {
                const tex = uniform.value;
                this.textureEntries.push({ name, binding: binding, lastTexture: null, lastGpuTexture: null, isCube: tex.isCube });
                entries.push({
                    binding: binding++,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: tex.isCube ? 'cube' : '2d',
                    },
                });
                entries.push({
                    binding: binding++,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' },
                });
            }
        }

        this._textureEntryCount = this.textureEntries.length;
        this.bindGroupLayout = this.device.createBindGroupLayout({ entries });
    }

    _packUniforms() {
        if (!this.uniformLayout) return;

        // Reset pool offset at start of each render pass
        if (this._lastRenderPassId !== this.renderer._renderPassId) {
            this._uniformPoolOffset = 0;
            this._lastRenderPassId = this.renderer._renderPassId;
        }

        const layout = this.uniformLayout;
        const layoutLen = this._uniformLayoutLength;
        const uniforms = this.uniforms;
        const uniformData = this.uniformData;

        for (let i = 0; i < layoutLen; i++) {
            const entry = layout[i];
            const uniform = uniforms[entry.name];
            if (!uniform || uniform.value === undefined) continue;

            const value = uniform.value;
            const floatOffset = entry.offset / 4;

            // Array of vectors
            if (entry.isArray) {
                const strideFloats = entry.elemStride / 4;
                for (let j = 0; j < entry.count; j++) {
                    if (value[j] && value[j].length !== undefined) {
                        uniformData.set(value[j], floatOffset + strideFloats * j);
                    }
                }
                continue;
            }

            if (typeof value === 'number') {
                uniformData[floatOffset] = value;
            } else if (value.length === 9) {
                // mat3: pack as 3 vec4-aligned columns (12 floats, but aligned per column)
                uniformData[floatOffset] = value[0];
                uniformData[floatOffset + 1] = value[1];
                uniformData[floatOffset + 2] = value[2];
                // padding at floatOffset + 3
                uniformData[floatOffset + 4] = value[3];
                uniformData[floatOffset + 5] = value[4];
                uniformData[floatOffset + 6] = value[5];
                // padding at floatOffset + 7
                uniformData[floatOffset + 8] = value[6];
                uniformData[floatOffset + 9] = value[7];
                uniformData[floatOffset + 10] = value[8];
            } else if (value.length !== undefined) {
                uniformData.set(value, floatOffset);
            }
        }

        // Ensure pool buffer has space for this draw
        const needed = this._uniformPoolOffset + this._uniformAlignedSize;
        if (!this._uniformPoolBuffer || this._uniformPoolCapacity < needed) {
            if (this._uniformPoolBuffer) this._uniformPoolBuffer.destroy();
            this._uniformPoolCapacity = Math.max(needed, 256 * this._uniformAlignedSize);
            this._uniformPoolBuffer = this.device.createBuffer({
                size: this._uniformPoolCapacity,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            this.bindGroup = null; // Force rebuild with new buffer
        }

        // Write uniform data at the current pool offset
        this._currentDynamicOffset = this._uniformPoolOffset;
        this.device.queue.writeBuffer(this._uniformPoolBuffer, this._uniformPoolOffset, this.uniformData);
        this._uniformPoolOffset += this._uniformAlignedSize;
    }

    _buildBindGroup() {
        const entries = [];
        let binding = 0;

        if (this.uniformLayout) {
            entries.push({ binding: binding++, resource: { buffer: this._uniformPoolBuffer, size: this._uniformBufferSize } });
        }

        const texEntries = this.textureEntries;
        for (let i = 0, l = texEntries.length; i < l; i++) {
            const texEntry = texEntries[i];
            const tex = this.uniforms[texEntry.name].value;
            entries.push({ binding: binding++, resource: tex.gpuTexture.createView(texEntry.isCube ? CUBE_VIEW_DESC : DEFAULT_VIEW_DESC) });
            entries.push({ binding: binding++, resource: tex.gpuSampler });
        }

        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries,
        });
    }

    getPipeline(vertexLayouts, colorFormats, depthFormat, objectBindGroupLayout, layoutKey, indexFormat) {
        // Build cache key. The layoutKey is pre-computed by Geometry.getLayoutKey().
        // colorFormatsKey is pre-computed per render pass on the renderer.
        const colorFormatsKey = this.renderer._currentColorFormatsKey;

        const key = (layoutKey || JSON.stringify(vertexLayouts)) + '|' + colorFormatsKey + '|' + (depthFormat || '') + '|' + (objectBindGroupLayout ? '1' : '0')
            + (this._isStrip && indexFormat ? '|' + indexFormat : '')
            + this._immutablePipelineKey;

        const cached = this.pipelineCache.get(key);
        if (cached) return cached;

        // Build pipeline layout with both bind groups
        const bindGroupLayouts = [this.bindGroupLayout];
        if (objectBindGroupLayout) bindGroupLayouts.push(objectBindGroupLayout);

        this.pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts });

        // Depth stencil state
        let depthStencil;
        if (depthFormat) {
            depthStencil = {
                format: depthFormat,
                depthWriteEnabled: this.depthWrite,
                depthCompare: this.depthTest ? this.depthFunc : 'always',
            };
            if ((this.stencilFront || this.stencilBack) && depthFormat.includes('stencil')) {
                depthStencil.stencilFront = this._mergedStencilFront;
                depthStencil.stencilBack = this._mergedStencilBack;
                depthStencil.stencilReadMask = this.stencilReadMask;
                depthStencil.stencilWriteMask = this.stencilWriteMask;
            }
        }

        // Color targets with optional blending
        const blendState = this._blendState;
        const targets = new Array(colorFormats.length);
        for (let i = 0, l = colorFormats.length; i < l; i++) {
            const target = { format: colorFormats[i] };
            if (blendState) target.blend = blendState;
            targets[i] = target;
        }

        const primitive = {
            topology: this.topology,
            frontFace: this.frontFace,
            cullMode: this._cullMode,
        };
        if (this._isStrip && indexFormat) primitive.stripIndexFormat = indexFormat;

        const descriptor = {
            layout: this.pipelineLayout,
            vertex: {
                module: this.vertexModule,
                entryPoint: 'main',
                buffers: vertexLayouts,
            },
            fragment: {
                module: this.fragmentModule,
                entryPoint: 'main',
                targets,
            },
            primitive,
        };

        if (depthStencil) descriptor.depthStencil = depthStencil;

        const pipeline = this.device.createRenderPipeline(descriptor);
        this.pipelineCache.set(key, pipeline);
        return pipeline;
    }

    use({ passEncoder, renderState }) {
        // Pack and upload uniforms to pool at unique offset per draw
        this._packUniforms();

        // Update textures and check if bind group needs rebuilding
        let needsRebuild = !this.bindGroup;
        const texEntries = this.textureEntries;
        for (let i = 0, l = texEntries.length; i < l; i++) {
            const texEntry = texEntries[i];
            const tex = this.uniforms[texEntry.name].value;
            if (tex.needsUpdate) {
                tex.update();
                needsRebuild = true;
            }
            if (tex !== texEntry.lastTexture || tex.gpuTexture !== texEntry.lastGpuTexture) {
                texEntry.lastTexture = tex;
                texEntry.lastGpuTexture = tex.gpuTexture;
                needsRebuild = true;
            }
        }

        if (needsRebuild) this._buildBindGroup();

        if (this.uniformLayout) {
            // Always set bind group with dynamic offset (offset changes per draw)
            passEncoder.setBindGroup(0, this.bindGroup, [this._currentDynamicOffset]);
        } else if (!renderState || renderState.program !== this || needsRebuild) {
            // No dynamic offsets — use render state tracking to skip redundant calls
            passEncoder.setBindGroup(0, this.bindGroup);
            if (renderState) renderState.program = this;
        }

        // Set stencil reference value for stencil operations
        if (this.stencilFront || this.stencilBack) {
            passEncoder.setStencilReference(this.stencilRef);
        }
    }

    remove() {
        if (this._uniformPoolBuffer) this._uniformPoolBuffer.destroy();
    }
}
