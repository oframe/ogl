let ID = 1;

// Map common filter/wrap values
const FILTER_MAP = {
    nearest: 'nearest',
    linear: 'linear',
};

const ADDRESS_MAP = {
    repeat: 'repeat',
    'mirror-repeat': 'mirror-repeat',
    'clamp-to-edge': 'clamp-to-edge',
};

export class Texture {
    constructor(
        gpu,
        {
            image,
            width = 1,
            height = 1,
            format = 'rgba8unorm',
            dimension = '2d',
            target,
            generateMipmaps = false,
            flipY = true,
            minFilter = 'linear',
            magFilter = 'linear',
            mipmapFilter = 'linear',
            wrapS = 'clamp-to-edge',
            wrapT = 'clamp-to-edge',
            wrapR = 'clamp-to-edge',
            anisotropy = 0,
            usage,
        } = {}
    ) {
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        this.id = ID++;
        this._isTexture = true;

        this.format = format;
        this.dimension = dimension;
        this.isCube = target === 'cube';
        this.generateMipmaps = generateMipmaps;
        this.flipY = this.isCube ? false : flipY;
        this.width = width;
        this.height = height;

        // Sampler parameters
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.mipmapFilter = mipmapFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.wrapR = wrapR;
        this.anisotropy = anisotropy;

        // GPU resources
        this.gpuTexture = null;
        this.gpuSampler = null;
        this.needsUpdate = false;

        // Compressed formats cannot use RENDER_ATTACHMENT
        const isCompressed = format.startsWith('bc') || format.startsWith('etc2') || format.startsWith('astc');
        this._usage = usage || (isCompressed
            ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
            : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT);

        // Create sampler
        this._createSampler();

        // Create initial texture (empty 1x1 or sized)
        if (image) {
            this.image = image;
        } else {
            this._createTexture(width, height);
        }
    }

    _createSampler() {
        const desc = {
            minFilter: FILTER_MAP[this.minFilter] || 'linear',
            magFilter: FILTER_MAP[this.magFilter] || 'linear',
            mipmapFilter: FILTER_MAP[this.mipmapFilter] || 'linear',
            addressModeU: ADDRESS_MAP[this.wrapS] || 'clamp-to-edge',
            addressModeV: ADDRESS_MAP[this.wrapT] || 'clamp-to-edge',
            addressModeW: ADDRESS_MAP[this.wrapR] || 'clamp-to-edge',
        };
        if (this.anisotropy > 0) desc.maxAnisotropy = this.anisotropy;
        this.gpuSampler = this.device.createSampler(desc);
    }

    _createTexture(width, height) {
        if (this.gpuTexture) this.gpuTexture.destroy();

        this.width = width;
        this.height = height;

        const mipLevelCount = this.generateMipmaps ? Math.floor(Math.log2(Math.max(width, height))) + 1 : 1;

        this.gpuTexture = this.device.createTexture({
            size: this.isCube ? [width, height, 6] : [width, height],
            format: this.format,
            dimension: this.dimension,
            mipLevelCount,
            usage: this._usage,
        });
    }

    set image(value) {
        this._image = value;

        if (!value) return;

        // Cube map: array of 6 images
        if (this.isCube && Array.isArray(value)) {
            const w = value[0].width || value[0].videoWidth;
            const h = value[0].height || value[0].videoHeight;
            if (w && h) {
                this._createTexture(w, h);
                for (let i = 0; i < 6; i++) {
                    this.device.queue.copyExternalImageToTexture(
                        { source: value[i], flipY: this.flipY },
                        { texture: this.gpuTexture, origin: [0, 0, i] },
                        [w, h]
                    );
                }
                this.onUpdate && this.onUpdate();
            }
            return;
        }

        // Compressed texture: array of {data, width, height} mip levels with isCompressedTexture flag
        if (Array.isArray(value) && value.isCompressedTexture) {
            const w = value[0].width;
            const h = value[0].height;
            this.width = w;
            this.height = h;

            // Recalculate usage to exclude RENDER_ATTACHMENT for compressed formats
            const compressedUsage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;

            if (this.gpuTexture) this.gpuTexture.destroy();
            this.gpuTexture = this.device.createTexture({
                size: [w, h],
                format: this.format,
                mipLevelCount: value.length,
                usage: compressedUsage,
            });

            const blockInfo = this._getCompressedBlockInfo();
            for (let i = 0; i < value.length; i++) {
                const mip = value[i];
                const bytesPerRow = Math.ceil(mip.width / blockInfo.blockWidth) * blockInfo.bytesPerBlock;
                this.device.queue.writeTexture(
                    { texture: this.gpuTexture, mipLevel: i },
                    mip.data,
                    { bytesPerRow },
                    [mip.width, mip.height]
                );
            }
            this.onUpdate && this.onUpdate();
            return;
        }

        if (value instanceof HTMLImageElement || value instanceof HTMLVideoElement || value instanceof HTMLCanvasElement || value instanceof ImageBitmap || value instanceof OffscreenCanvas) {
            const w = value.width || value.videoWidth;
            const h = value.height || value.videoHeight;

            if (w && h) {
                this._createTexture(w, h);
                this.device.queue.copyExternalImageToTexture({ source: value, flipY: this.flipY }, { texture: this.gpuTexture }, [w, h]);
                if (this.generateMipmaps) this._generateMipmaps();
                this.onUpdate && this.onUpdate();
            }
        } else if (ArrayBuffer.isView(value)) {
            // TypedArray data — check for .width/.height properties (e.g. from BasisWorker uncompressed fallback)
            const w = value.width || this.width;
            const h = value.height || this.height;
            this._createTexture(w, h);
            const bytesPerRow = this._getBytesPerRow(w);
            this.device.queue.writeTexture({ texture: this.gpuTexture }, value, { bytesPerRow, rowsPerImage: h }, [w, h]);
            if (this.generateMipmaps) this._generateMipmaps();
            this.onUpdate && this.onUpdate();
        }
    }

    get image() {
        return this._image;
    }

    _getBytesPerRow(width) {
        // Compute bytes per row based on format (no 256 alignment needed for writeTexture)
        const blockSize = this.format.includes('rgba') ? 4 : this.format.includes('rg') ? 2 : 1;
        const bytesPerPixel = this.format.includes('32float') ? blockSize * 4 : this.format.includes('16float') ? blockSize * 2 : blockSize;
        return width * bytesPerPixel;
    }

    _getCompressedBlockInfo() {
        const f = this.format;
        // BC1 and ETC2 RGB variants: 8 bytes per 4x4 block
        if (f.startsWith('bc1') || f === 'etc2-rgb8unorm' || f === 'etc2-rgb8unorm-srgb') {
            return { blockWidth: 4, blockHeight: 4, bytesPerBlock: 8 };
        }
        // BC2, BC3, BC7, ETC2 RGBA, ASTC 4x4: 16 bytes per 4x4 block
        if (f.startsWith('bc') || f.startsWith('etc2') || f === 'astc-4x4-unorm' || f === 'astc-4x4-unorm-srgb') {
            return { blockWidth: 4, blockHeight: 4, bytesPerBlock: 16 };
        }
        // Other ASTC block sizes (all 16 bytes per block)
        const astcMatch = f.match(/astc-(\d+)x(\d+)/);
        if (astcMatch) return { blockWidth: parseInt(astcMatch[1]), blockHeight: parseInt(astcMatch[2]), bytesPerBlock: 16 };
        return { blockWidth: 1, blockHeight: 1, bytesPerBlock: 4 };
    }

    _generateMipmaps() {
        // Mipmap generation via render passes
        if (!Texture._mipmapShaderModule) {
            Texture._mipmapShaderModule = this.device.createShaderModule({
                code: `
                    var<private> pos : array<vec2f, 3> = array<vec2f, 3>(
                        vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));

                    struct VertexOutput {
                        @builtin(position) position : vec4f,
                        @location(0) uv : vec2f,
                    }

                    @vertex fn vert(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        let p = pos[vertexIndex];
                        output.position = vec4f(p, 0.0, 1.0);
                        output.uv = p * vec2f(0.5, -0.5) + vec2f(0.5);
                        return output;
                    }

                    @group(0) @binding(0) var imgSampler : sampler;
                    @group(0) @binding(1) var img : texture_2d<f32>;

                    @fragment fn frag(@location(0) uv : vec2f) -> @location(0) vec4f {
                        return textureSample(img, imgSampler, uv);
                    }
                `,
            });
        }

        if (!Texture._mipmapSampler) {
            Texture._mipmapSampler = this.device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
        }

        // Cache mipmap pipeline per format to avoid redundant pipeline creation
        if (!Texture._mipmapPipelines) Texture._mipmapPipelines = {};
        let pipeline = Texture._mipmapPipelines[this.format];
        if (!pipeline) {
            pipeline = this.device.createRenderPipeline({
                layout: 'auto',
                vertex: { module: Texture._mipmapShaderModule, entryPoint: 'vert' },
                fragment: {
                    module: Texture._mipmapShaderModule,
                    entryPoint: 'frag',
                    targets: [{ format: this.format }],
                },
                primitive: { topology: 'triangle-list' },
            });
            Texture._mipmapPipelines[this.format] = pipeline;
        }

        const commandEncoder = this.device.createCommandEncoder();
        const mipLevelCount = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;

        for (let i = 1; i < mipLevelCount; i++) {
            const bindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: Texture._mipmapSampler },
                    { binding: 1, resource: this.gpuTexture.createView({ baseMipLevel: i - 1, mipLevelCount: 1 }) },
                ],
            });

            const pass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.gpuTexture.createView({ baseMipLevel: i, mipLevelCount: 1 }),
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
        }

        this.device.queue.submit([commandEncoder.finish()]);
    }

    update() {
        if (this.needsUpdate) {
            if (this._image) this.image = this._image;
            this.needsUpdate = false;
        }
    }

    remove() {
        if (this.gpuTexture) this.gpuTexture.destroy();
    }
}
