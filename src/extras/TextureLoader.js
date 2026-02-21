import { Texture } from '../core/Texture.js';
import { KTXTexture } from './KTXTexture.js';

// For compressed textures, generate using https://github.com/TimvanScherpenzeel/texture-compressor

let cache = {};
const supportedExtensions = [];

export class TextureLoader {
    static load(
        gpu,
        {
            src, // string or object of extension:src key-values
            // {
            //     s3tc: '...ktx',
            //     etc: '...ktx',
            //     etc1: '...ktx',
            //     astc: '...ktx',
            //     webp: '...webp',
            //     jpg: '...jpg',
            //     png: '...png',
            // }

            // Only props relevant to KTXTexture
            wrapS = 'clamp-to-edge',
            wrapT = 'clamp-to-edge',
            anisotropy = 0,

            // For regular images
            generateMipmaps = true,
            minFilter = 'linear',
            magFilter = 'linear',
            flipY = true,
        } = {}
    ) {
        const support = this.getSupportedExtensions(gpu);
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
        const cacheID = src + wrapS + wrapT + anisotropy + generateMipmaps + minFilter + magFilter + flipY + (gpu.renderer || gpu).id;

        // Check cache for existing texture
        if (cache[cacheID]) return cache[cacheID];

        let texture;
        switch (ext) {
            case 'ktx':
            case 's3tc':
            case 'etc':
            case 'etc1':
            case 'astc':
                // Load compressed texture using KTX format
                texture = new KTXTexture(gpu, {
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
                texture = new Texture(gpu, {
                    wrapS,
                    wrapT,
                    anisotropy,
                    generateMipmaps,
                    minFilter,
                    magFilter,
                    flipY,
                });
                texture.loaded = this.loadImage(gpu, src, texture, flipY);
                break;
            default:
                console.warn('No supported format supplied');
                texture = new Texture(gpu);
        }

        texture.ext = ext;
        cache[cacheID] = texture;
        return texture;
    }

    static getSupportedExtensions(gpu) {
        if (supportedExtensions.length) return supportedExtensions;

        const device = (gpu.renderer || gpu).device;
        const features = device.features;

        // Check WebGPU compressed texture features
        if (features.has('texture-compression-bc')) {
            supportedExtensions.push('s3tc', 'bc7');
        }
        if (features.has('texture-compression-etc2')) {
            supportedExtensions.push('etc', 'etc1');
        }
        if (features.has('texture-compression-astc')) {
            supportedExtensions.push('astc');
        }

        // Formats supported by all
        supportedExtensions.push('png', 'jpg', 'webp');

        return supportedExtensions;
    }

    static loadKTX(src, texture) {
        return fetch(src)
            .then((res) => res.arrayBuffer())
            .then((buffer) => texture.parseBuffer(buffer));
    }

    static loadImage(gpu, src, texture, flipY) {
        return decodeImage(src, flipY).then((imgBmp) => {
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

function decodeImage(src, flipY) {
    return new Promise((resolve, reject) => {
        if (isCreateImageBitmap()) {
            fetch(src, { mode: 'cors' })
                .then((r) => r.blob())
                .then((b) => createImageBitmap(b, { imageOrientation: flipY ? 'flipY' : 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
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
