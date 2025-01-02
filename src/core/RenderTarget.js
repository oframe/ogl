import { Texture } from './Texture.js'

export class RenderTarget {
    constructor(
        gl,
        {
            width = gl.canvas.width,
            height = gl.canvas.height,
            target = gl.FRAMEBUFFER,
            color = 1, // number of color attachments
            depth = true,
            stencil = false,
            depthTexture = false,
            wrapS = gl.CLAMP_TO_EDGE,
            wrapT = gl.CLAMP_TO_EDGE,
            wrapR = gl.CLAMP_TO_EDGE,
            minFilter = gl.LINEAR,
            magFilter = minFilter,
            type = gl.UNSIGNED_BYTE,
            format = gl.RGBA,
            internalFormat = format,
            unpackAlignment,
            premultiplyAlpha,
        } = {}
    ) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.stencil = stencil;
        this.buffer = this.gl.createFramebuffer();
        this.target = target;
        this.gl.renderer.bindFramebuffer(this);

        this.textures = [];
        const drawBuffers = [];

        // create and attach required num of color textures
        for (let i = 0; i < color; i++) {
            this.textures.push(
                new Texture(gl, {
                    width,
                    height,
                    wrapS,
                    wrapT,
                    wrapR,
                    minFilter,
                    magFilter,
                    type,
                    format,
                    internalFormat,
                    unpackAlignment,
                    premultiplyAlpha,
                    flipY: false,
                    generateMipmaps: false,
                })
            );
            this.textures[i].update();
            this.gl.framebufferTexture2D(this.target, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, this.textures[i].texture, 0 /* level */);
            drawBuffers.push(this.gl.COLOR_ATTACHMENT0 + i);
        }

        // For multi-render targets shader access
        if (drawBuffers.length > 1) this.gl.renderer.drawBuffers(drawBuffers);

        // alias for majority of use cases
        this.texture = this.textures[0];

        // note depth textures break stencil - so can't use together
        if (depthTexture && (this.gl.renderer.isWebgl2 || this.gl.renderer.getExtension('WEBGL_depth_texture'))) {
            this.depthTexture = new Texture(gl, {
                width,
                height,
                minFilter: this.gl.NEAREST,
                magFilter: this.gl.NEAREST,
                format: this.stencil ? this.gl.DEPTH_STENCIL : this.gl.DEPTH_COMPONENT,
                internalFormat: gl.renderer.isWebgl2 ? (this.stencil ? this.gl.DEPTH24_STENCIL8 : this.gl.DEPTH_COMPONENT16) : this.gl.DEPTH_COMPONENT,
                type: this.stencil ? this.gl.UNSIGNED_INT_24_8 : this.gl.UNSIGNED_INT,
            });
            this.depthTexture.update();
            this.gl.framebufferTexture2D(this.target, this.stencil ? this.gl.DEPTH_STENCIL_ATTACHMENT : this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture.texture, 0 /* level */);
        } else {
            // Render buffers
            if (depth && !stencil) {
                this.depthBuffer = this.gl.createRenderbuffer();
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
                this.gl.framebufferRenderbuffer(this.target, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffer);
            }

            if (stencil && !depth) {
                this.stencilBuffer = this.gl.createRenderbuffer();
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.stencilBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.STENCIL_INDEX8, width, height);
                this.gl.framebufferRenderbuffer(this.target, this.gl.STENCIL_ATTACHMENT, this.gl.RENDERBUFFER, this.stencilBuffer);
            }

            if (depth && stencil) {
                this.depthStencilBuffer = this.gl.createRenderbuffer();
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthStencilBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_STENCIL, width, height);
                this.gl.framebufferRenderbuffer(this.target, this.gl.DEPTH_STENCIL_ATTACHMENT, this.gl.RENDERBUFFER, this.depthStencilBuffer);
            }
        }

        this.gl.renderer.bindFramebuffer({ target: this.target });
    }

    setSize(width, height) {
        if (this.width === width && this.height === height) return;

        this.width = width;
        this.height = height;
        this.gl.renderer.bindFramebuffer(this);

        for (let i = 0; i < this.textures.length; i++) {
            this.textures[i].width = width;
            this.textures[i].height = height;
            this.textures[i].needsUpdate = true;
            this.textures[i].update();
            this.gl.framebufferTexture2D(this.target, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, this.textures[i].texture, 0 /* level */);
        }

        if (this.depthTexture) {
            this.depthTexture.width = width;
            this.depthTexture.height = height;
            this.depthTexture.needsUpdate = true;
            this.depthTexture.update();
            this.gl.framebufferTexture2D(this.target, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture.texture, 0 /* level */);
        } else {
            if (this.depthBuffer) {
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
            }

            if (this.stencilBuffer) {
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.stencilBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.STENCIL_INDEX8, width, height);
            }

            if (this.depthStencilBuffer) {
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthStencilBuffer);
                this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_STENCIL, width, height);
            }
        }

        this.gl.renderer.bindFramebuffer({ target: this.target });
    }
}
