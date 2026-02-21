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
        this.stencilFront = stencilFront || stencil || undefined;
        this.stencilBack = stencilBack || stencil || undefined;
        this.stencilReadMask = stencilReadMask;
        this.stencilWriteMask = stencilWriteMask;
        this.stencilRef = stencilRef;

        // Create shader modules
        this.vertexModule = this.device.createShaderModule({ code: vertex });
        this.fragmentModule = this.device.createShaderModule({ code: fragment });

        // Pipeline cache: key → GPURenderPipeline
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
                this.textureEntries.push({ name, binding: binding, lastTexture: null });
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

        this.bindGroupLayout = this.device.createBindGroupLayout({ entries });
    }

    _packUniforms() {
        if (!this.uniformLayout) return;

        // Reset pool offset at start of each render pass
        if (this._lastRenderPassId !== this.renderer._renderPassId) {
            this._uniformPoolOffset = 0;
            this._lastRenderPassId = this.renderer._renderPassId;
        }

        for (const entry of this.uniformLayout) {
            const uniform = this.uniforms[entry.name];
            if (!uniform || uniform.value === undefined) continue;

            const value = uniform.value;
            const floatOffset = entry.offset / 4;

            // Array of vectors
            if (entry.isArray) {
                const strideFloats = entry.elemStride / 4;
                for (let i = 0; i < entry.count; i++) {
                    if (value[i] && value[i].length !== undefined) {
                        this.uniformData.set(value[i], floatOffset + strideFloats * i);
                    }
                }
                continue;
            }

            if (typeof value === 'number') {
                this.uniformData[floatOffset] = value;
            } else if (value.length === 9) {
                // mat3: pack as 3 vec4-aligned columns (12 floats, but aligned per column)
                this.uniformData[floatOffset] = value[0];
                this.uniformData[floatOffset + 1] = value[1];
                this.uniformData[floatOffset + 2] = value[2];
                // padding at floatOffset + 3
                this.uniformData[floatOffset + 4] = value[3];
                this.uniformData[floatOffset + 5] = value[4];
                this.uniformData[floatOffset + 6] = value[5];
                // padding at floatOffset + 7
                this.uniformData[floatOffset + 8] = value[6];
                this.uniformData[floatOffset + 9] = value[7];
                this.uniformData[floatOffset + 10] = value[8];
            } else if (value.length !== undefined) {
                this.uniformData.set(value, floatOffset);
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

        for (const texEntry of this.textureEntries) {
            const tex = this.uniforms[texEntry.name].value;
            const viewDescriptor = tex.isCube ? { dimension: 'cube' } : {};
            entries.push({ binding: binding++, resource: tex.gpuTexture.createView(viewDescriptor) });
            entries.push({ binding: binding++, resource: tex.gpuSampler });
        }

        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries,
        });
    }

    getPipeline(vertexLayouts, colorFormats, depthFormat, objectBindGroupLayout, layoutKey, indexFormat) {
        const isStrip = this.topology === 'line-strip' || this.topology === 'triangle-strip';
        const key = (layoutKey || JSON.stringify(vertexLayouts)) + '|' + colorFormats.join(',') + '|' + (depthFormat || '') + '|' + (objectBindGroupLayout ? '1' : '0') + (isStrip && indexFormat ? '|' + indexFormat : '')
            + (this.blendSrc ? '|' + this.blendSrc + this.blendDst + this.blendSrcAlpha + this.blendDstAlpha + this.blendEquation + this.blendEquationAlpha : '')
            + (this.stencilFront ? '|sf' + JSON.stringify(this.stencilFront) : '')
            + (this.stencilBack ? '|sb' + JSON.stringify(this.stencilBack) : '');

        if (this.pipelineCache.has(key)) return this.pipelineCache.get(key);

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
            if (this.stencilFront || this.stencilBack) {
                const defaultStencil = { compare: 'always', failOp: 'keep', depthFailOp: 'keep', passOp: 'keep' };
                depthStencil.stencilFront = { ...defaultStencil, ...this.stencilFront };
                depthStencil.stencilBack = { ...defaultStencil, ...this.stencilBack };
                depthStencil.stencilReadMask = this.stencilReadMask;
                depthStencil.stencilWriteMask = this.stencilWriteMask;
            }
        }

        // Color targets with optional blending
        const targets = colorFormats.map((format) => {
            const target = { format };
            if (this.blendSrc) {
                target.blend = {
                    color: { srcFactor: this.blendSrc, dstFactor: this.blendDst, operation: this.blendEquation },
                    alpha: { srcFactor: this.blendSrcAlpha, dstFactor: this.blendDstAlpha, operation: this.blendEquationAlpha },
                };
            }
            return target;
        });

        // Cull mode mapping
        let cullMode = 'none';
        if (this.cullFace === 'back' || this.cullFace === true) cullMode = 'back';
        else if (this.cullFace === 'front') cullMode = 'front';
        else if (this.cullFace === false) cullMode = 'none';

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
            primitive: {
                topology: this.topology,
                frontFace: this.frontFace,
                cullMode,
                ...(isStrip && indexFormat ? { stripIndexFormat: indexFormat } : {}),
            },
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
        for (const texEntry of this.textureEntries) {
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
