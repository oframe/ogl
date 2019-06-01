// TODO: facilitate Compressed Textures
// TODO: cube map
// TODO: delete texture
// TODO: should I support anisotropy? Maybe a way to extend the update easily
// TODO: check is ArrayBuffer.isView is best way to check for Typed Arrays?
// TODO: use texSubImage2D for updates
// TODO: need? encoding = linearEncoding

const emptyPixel = new Uint8Array(4);

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

let ID = 0;

export class Texture {
    constructor(gl, {
        image,
        target = gl.TEXTURE_2D,
        type = gl.UNSIGNED_BYTE,
        format = gl.RGBA,
        internalFormat = format,
        wrapS = gl.CLAMP_TO_EDGE,
        wrapT = gl.CLAMP_TO_EDGE,
        generateMipmaps = true,
        minFilter = generateMipmaps ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR,
        magFilter = gl.LINEAR,
        premultiplyAlpha = false,
        unpackAlignment = 4,
        flipY = true,
        level = 0,
        width, // used for RenderTargets or Data Textures
        height = width,
    } = {}) {
        this.gl = gl;
        this.id = ID++;

        this.image = image;
        this.target = target;
        this.type = type;
        this.format = format;
        this.internalFormat = internalFormat;
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.generateMipmaps = generateMipmaps;
        this.premultiplyAlpha = premultiplyAlpha;
        this.unpackAlignment = unpackAlignment;
        this.flipY = flipY;
        this.level = level;
        this.width = width;
        this.height = height;
        this.texture = this.gl.createTexture();

        this.store = {
            image: null,
        };

        // Alias for state store to avoid redundant calls for global state
        this.glState = this.gl.renderer.state;

        // State store to avoid redundant calls for per-texture state
        this.state = {};
        this.state.minFilter = this.gl.NEAREST_MIPMAP_LINEAR;
        this.state.magFilter = this.gl.LINEAR;
        this.state.wrapS = this.gl.REPEAT;
        this.state.wrapT = this.gl.REPEAT;
    }

    bind() {

        // Already bound to active texture unit
        if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id) return;
        this.gl.bindTexture(this.target, this.texture);
        this.glState.textureUnits[this.glState.activeTextureUnit] = this.id;
    }

    update(textureUnit = 0) {
        const needsUpdate = !(this.image === this.store.image && !this.needsUpdate);

        // Make sure that texture is bound to its texture unit
        if (needsUpdate || this.glState.textureUnits[textureUnit] !== this.id) {

            // set active texture unit to perform texture functions
            this.gl.renderer.activeTexture(textureUnit);
            this.bind();
        }

        if (!needsUpdate) return;
        this.needsUpdate = false;

        if (this.flipY !== this.glState.flipY) {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
            this.glState.flipY = this.flipY;
        }

        if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
            this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
            this.glState.premultiplyAlpha = this.premultiplyAlpha;
        }

        if (this.unpackAlignment !== this.glState.unpackAlignment) {
            this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment);
            this.glState.unpackAlignment = this.unpackAlignment;
        }

        if (this.minFilter !== this.state.minFilter) {
            this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
            this.state.minFilter = this.minFilter;
        }

        if (this.magFilter !== this.state.magFilter) {
            this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
            this.state.magFilter = this.magFilter;
        }

        if (this.wrapS !== this.state.wrapS) {
            this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS);
            this.state.wrapS = this.wrapS;
        }

        if (this.wrapT !== this.state.wrapT) {
            this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT);
            this.state.wrapT = this.wrapT;
        }

        if (this.image) {

            if (this.image.width) {
                this.width = this.image.width;
                this.height = this.image.height;
            }

            // TODO: all sides if cubemap
            // gl.TEXTURE_CUBE_MAP_POSITIVE_X
            
            // TODO: check is ArrayBuffer.isView is best way to check for Typed Arrays?
            if (this.gl.renderer.isWebgl2 || ArrayBuffer.isView(this.image)) {
                this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0 /* border */, this.format, this.type, this.image);
            } else {
                this.gl.texImage2D(this.target, this.level, this.internalFormat, this.format, this.type, this.image);
            }

            // TODO: support everything
            // WebGL1:
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
            // gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
            // gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
            // gl.texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
            // gl.texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);
            // gl.texImage2D(target, level, internalformat, format, type, ImageBitmap? pixels);

            // WebGL2:
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, GLintptr offset);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLCanvasElement source);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLImageElement source);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLVideoElement source);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageBitmap source);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageData source);
            // gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView srcData, srcOffset);

            if (this.generateMipmaps) {

                // For WebGL1, if not a power of 2, turn off mips, set wrapping to clamp to edge and minFilter to linear
                if (!this.gl.renderer.isWebgl2 && (!isPowerOf2(this.image.width) || !isPowerOf2(this.image.height))) {
                    this.generateMipmaps = false;
                    this.wrapS = this.wrapT = this.gl.CLAMP_TO_EDGE;
                    this.minFilter = this.gl.LINEAR;
                } else {
                    this.gl.generateMipmap(this.target);
                }
            }
        } else {

            if (this.width) {

                // image intentionally left null for RenderTarget
                this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, null);
            } else {

                // Upload empty pixel if no image to avoid errors while image or video loading
                this.gl.texImage2D(this.target, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixel);
            }

        }
        this.store.image = this.image;

        this.onUpdate && this.onUpdate();
    }
}