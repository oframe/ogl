import { Texture } from './Texture.js';

export class RenderTarget {
    constructor(
        gpu,
        {
            width,
            height,
            color = 1,
            depth = true,
            stencil = false,
            depthTexture = false,
            format = 'rgba8unorm',
            depthFormat,
        } = {}
    ) {
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        width = width ?? this.renderer.canvas.width;
        height = height ?? this.renderer.canvas.height;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.stencil = stencil;
        this.format = format;

        if (!depthFormat) {
            depthFormat = stencil ? 'depth24plus-stencil8' : 'depth24plus';
        }
        this.depthFormat = depthFormat;

        this.textures = [];
        for (let i = 0; i < color; i++) {
            this.textures.push(
                new Texture(gpu, {
                    width,
                    height,
                    format,
                    flipY: false,
                    generateMipmaps: false,
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
                })
            );
        }

        this.texture = this.textures[0];

        // Depth texture
        if (depth || stencil) {
            if (depthTexture) {
                this.depthTexture = new Texture(gpu, {
                    width,
                    height,
                    format: this.depthFormat,
                    flipY: false,
                    generateMipmaps: false,
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
                });
            } else {
                // Non-readable depth texture (render attachment only)
                this._depthGPUTexture = this.device.createTexture({
                    size: [width, height],
                    format: this.depthFormat,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT,
                });
            }
        }
    }

    getPassDescriptor({ clear = true, clearColor = { r: 0, g: 0, b: 0, a: 1 } } = {}) {
        const colorAttachments = this.textures.map((tex) => ({
            view: tex.gpuTexture.createView(),
            clearValue: clearColor,
            loadOp: clear ? 'clear' : 'load',
            storeOp: 'store',
        }));

        let depthStencilAttachment;
        if (this.depth || this.stencil) {
            const depthView = this.depthTexture ? this.depthTexture.gpuTexture.createView() : this._depthGPUTexture.createView();

            depthStencilAttachment = {
                view: depthView,
                depthClearValue: 1.0,
                depthLoadOp: clear ? 'clear' : 'load',
                depthStoreOp: 'store',
            };

            if (this.stencil) {
                depthStencilAttachment.stencilClearValue = 0;
                depthStencilAttachment.stencilLoadOp = clear ? 'clear' : 'load';
                depthStencilAttachment.stencilStoreOp = 'store';
            }
        }

        return { colorAttachments, depthStencilAttachment };
    }

    async readPixel(x, y, textureIndex = 0) {
        const tex = this.textures[textureIndex];
        const bytesPerPixel = 4; // rgba8unorm = 4 bytes
        const bytesPerRow = Math.ceil(bytesPerPixel / 256) * 256 || 256;
        const readBuffer = this.device.createBuffer({
            size: bytesPerRow,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyTextureToBuffer(
            { texture: tex.gpuTexture, origin: [x, y, 0] },
            { buffer: readBuffer, bytesPerRow },
            [1, 1]
        );
        this.device.queue.submit([commandEncoder.finish()]);

        await readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Uint8Array(readBuffer.getMappedRange().slice(0, 4));
        readBuffer.unmap();
        readBuffer.destroy();
        return data;
    }

    setSize(width, height) {
        if (this.width === width && this.height === height) return;
        this.width = width;
        this.height = height;

        for (let i = 0; i < this.textures.length; i++) {
            this.textures[i]._createTexture(width, height);
        }

        if (this.depthTexture) {
            this.depthTexture._createTexture(width, height);
        } else if (this._depthGPUTexture) {
            this._depthGPUTexture.destroy();
            this._depthGPUTexture = this.device.createTexture({
                size: [width, height],
                format: this.depthFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
    }
}
