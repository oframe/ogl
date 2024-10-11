import { Texture } from '../core/Texture.js';
import { KTXTexture } from './KTXTexture.js';

// For compressed textures, generate using https://github.com/TimvanScherpenzeel/texture-compressor

let cache = {};
const supportedExtensions = [];

export class TextureLoader {
    static load(
        gl,
        {
            src, // string or object of extension:src key-values
            // {
            //     pvrtc: '...ktx',
            //     s3tc: '...ktx',
            //     etc: '...ktx',
            //     etc1: '...ktx',
            //     astc: '...ktx',
            //     webp: '...webp',
            //     jpg: '...jpg',
            //     png: '...png',
            // }

            // Only props relevant to KTXTexture
            wrapS = gl.CLAMP_TO_EDGE,
            wrapT = gl.CLAMP_TO_EDGE,
            anisotropy = 0,

            // For regular images
            format = gl.RGBA,
            internalFormat = format,
            generateMipmaps = true,
            minFilter = generateMipmaps ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR,
            magFilter = gl.LINEAR,
            premultiplyAlpha = false,
            unpackAlignment = 4,
            flipY = true,
        } = {}
    ) {
        const support = this.getSupportedExtensions(gl);
        let ext = 'none';

        // If src is string, determine which format from the extension
        if (typeof src === 'string') {
            ext = src.split('.').pop().split('?')[0].toLowerCase();
        }

        // If src is object, use supported extensions and provided list to choose best option
        // Get first supported match, so put in order of preference
        if (typeof src === 'object') {
            for (const prop in src) {
                if (support.includes(prop.toLowerCase())) {
                    ext = prop.toLowerCase();
                    src = src[prop];
                    break;
                }
            }
        }

        // Stringify props
        const cacheID = src + wrapS + wrapT + anisotropy + format + internalFormat + generateMipmaps + minFilter + magFilter + premultiplyAlpha + unpackAlignment + flipY + gl.renderer.id;

        // Check cache for existing texture
        if (cache[cacheID]) return cache[cacheID];

        let texture;
        switch (ext) {
            case 'ktx':
            case 'pvrtc':
            case 's3tc':
            case 'etc':
            case 'etc1':
            case 'astc':
                // Load compressed texture using KTX format
                texture = new KTXTexture(gl, {
                    src,
                    wrapS,
                    wrapT,
                    anisotropy,
                    minFilter,
                    magFilter,
                });
                texture.loaded = this.loadKTX(src, texture);
                break;
            case 'webp':
            case 'jpg':
            case 'jpeg':
            case 'png':
                texture = new Texture(gl, {
                    wrapS,
                    wrapT,
                    anisotropy,
                    format,
                    internalFormat,
                    generateMipmaps,
                    minFilter,
                    magFilter,
                    premultiplyAlpha,
                    unpackAlignment,
                    flipY,
                });
                texture.loaded = this.loadImage(gl, src, texture, flipY);
                break;
            default:
                console.warn('No supported format supplied');
                texture = new Texture(gl);
        }

        texture.ext = ext;
        cache[cacheID] = texture;
        return texture;
    }

    static getSupportedExtensions(gl) {
        if (supportedExtensions.length) return supportedExtensions;

        const extensions = {
            pvrtc: gl.renderer.getExtension('WEBGL_compressed_texture_pvrtc') || gl.renderer.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc'),
            s3tc: gl.renderer.getExtension('WEBGL_compressed_texture_s3tc'),
            // etc: gl.renderer.getExtension('WEBGL_compressed_texture_etc'),
            etc1: gl.renderer.getExtension('WEBGL_compressed_texture_etc1'),
            astc: gl.renderer.getExtension('WEBGL_compressed_texture_astc'),
            bc7: gl.renderer.getExtension('EXT_texture_compression_bptc'),
        };

        for (const ext in extensions) if (extensions[ext]) supportedExtensions.push(ext);

        // Formats supported by all
        supportedExtensions.push('png', 'jpg', 'webp');

        return supportedExtensions;
    }

    static loadKTX(src, texture) {
        return fetch(src)
            .then((res) => res.arrayBuffer())
            .then((buffer) => texture.parseBuffer(buffer));
    }

    static loadImage(gl, src, texture, flipY) {
        return decodeImage(src, flipY).then((imgBmp) => {
            // Catch non POT textures for WebGL1 and update params to avoid errors
            if (!gl.renderer.isWebgl2 && (!powerOfTwo(imgBmp.width) || !powerOfTwo(imgBmp.height))) {
                if (texture.generateMipmaps) texture.generateMipmaps = false;
                if (texture.minFilter === gl.NEAREST_MIPMAP_LINEAR) texture.minFilter = gl.LINEAR;
                if (texture.wrapS === gl.REPEAT) texture.wrapS = texture.wrapT = gl.CLAMP_TO_EDGE;
            }

            texture.image = imgBmp;

            // For createImageBitmap, close once uploaded
            texture.onUpdate = () => {
                if (imgBmp.close) imgBmp.close();
                texture.onUpdate = null;
            };

            return imgBmp;
        });
    }

    static clearCache() {
        cache = {};
    }
}

function powerOfTwo(value) {
    // (width & (width - 1)) !== 0
    return Math.log2(value) % 1 === 0;
}

function decodeImage(src, flipY) {
    return new Promise((resolve, reject) => {
        if (isCreateImageBitmap()) {
            fetch(src, { mode: 'cors' })
                .then((r) => r.blob())
                .then((b) => createImageBitmap(b, { imageOrientation: flipY ? 'flipY' : 'none', premultiplyAlpha: 'none' }))
                .then(resolve)
                .catch((err) => reject(err));
        } else {
            const img = new Image();

            img.crossOrigin = '';
            img.src = src;
            img.onerror = ({ type }) => reject(`${type}: Loading image`);
            img.onload = () => resolve(img);
        }
    });
}

function isCreateImageBitmap() {
    const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
    if (!isChrome) return false;
    try {
        createImageBitmap;
    } catch (e) {
        return false;
    }
    return true;
}
