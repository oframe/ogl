import { Texture } from '../core/Texture.js';

// TODO: Support cubemaps
// Generate textures using https://github.com/TimvanScherpenzeel/texture-compressor

// Map GL internal format constants to WebGPU format strings
const GL_TO_WEBGPU_FORMAT = {
    0x83f0: 'bc1-rgba-unorm', // COMPRESSED_RGB_S3TC_DXT1_EXT
    0x83f1: 'bc1-rgba-unorm', // COMPRESSED_RGBA_S3TC_DXT1_EXT
    0x83f2: 'bc2-rgba-unorm', // COMPRESSED_RGBA_S3TC_DXT3_EXT
    0x83f3: 'bc3-rgba-unorm', // COMPRESSED_RGBA_S3TC_DXT5_EXT
    0x8e8c: 'bc7-rgba-unorm', // COMPRESSED_RGBA_BPTC_UNORM_EXT
    0x9274: 'etc2-rgb8unorm', // COMPRESSED_RGB8_ETC2
    0x9275: 'etc2-rgb8unorm-srgb', // COMPRESSED_SRGB8_ETC2
    0x9278: 'etc2-rgba8unorm', // COMPRESSED_RGBA8_ETC2_EAC
    0x9279: 'etc2-rgba8unorm-srgb', // COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
    0x9270: 'etc2-rgb8unorm', // COMPRESSED_R11_EAC
    0x9272: 'etc2-rgb8unorm', // COMPRESSED_RG11_EAC (approx)
    0x93b0: 'astc-4x4-unorm', // COMPRESSED_RGBA_ASTC_4x4_KHR
    0x93b1: 'astc-5x4-unorm', // COMPRESSED_RGBA_ASTC_5x4_KHR
    0x93b2: 'astc-5x5-unorm', // COMPRESSED_RGBA_ASTC_5x5_KHR
    0x93b3: 'astc-6x5-unorm', // COMPRESSED_RGBA_ASTC_6x5_KHR
    0x93b4: 'astc-6x6-unorm', // COMPRESSED_RGBA_ASTC_6x6_KHR
    0x93b5: 'astc-8x5-unorm', // COMPRESSED_RGBA_ASTC_8x5_KHR
    0x93b6: 'astc-8x6-unorm', // COMPRESSED_RGBA_ASTC_8x6_KHR
    0x93b7: 'astc-8x8-unorm', // COMPRESSED_RGBA_ASTC_8x8_KHR
    0x93b8: 'astc-10x5-unorm', // COMPRESSED_RGBA_ASTC_10x5_KHR
    0x93b9: 'astc-10x6-unorm', // COMPRESSED_RGBA_ASTC_10x6_KHR
    0x93ba: 'astc-10x8-unorm', // COMPRESSED_RGBA_ASTC_10x8_KHR
    0x93bb: 'astc-10x10-unorm', // COMPRESSED_RGBA_ASTC_10x10_KHR
    0x93bc: 'astc-12x10-unorm', // COMPRESSED_RGBA_ASTC_12x10_KHR
    0x93bd: 'astc-12x12-unorm', // COMPRESSED_RGBA_ASTC_12x12_KHR
};

export class KTXTexture extends Texture {
    constructor(gpu, { buffer, wrapS = 'clamp-to-edge', wrapT = 'clamp-to-edge', anisotropy = 0, minFilter, magFilter } = {}) {
        super(gpu, {
            generateMipmaps: false,
            wrapS,
            wrapT,
            anisotropy,
            minFilter,
            magFilter,
        });

        if (buffer) return this.parseBuffer(buffer);
    }

    parseBuffer(buffer) {
        const ktx = new KhronosTextureContainer(buffer);
        ktx.mipmaps.isCompressedTexture = true;

        // Map GL internal format to WebGPU format
        const webgpuFormat = GL_TO_WEBGPU_FORMAT[ktx.glInternalFormat];
        if (webgpuFormat) {
            this.format = webgpuFormat;
        } else {
            console.warn(`KTXTexture: Unknown GL internal format 0x${ktx.glInternalFormat.toString(16)}`);
        }

        // Update texture
        this.image = ktx.mipmaps;

        if (ktx.numberOfMipmapLevels > 1) {
            if (this.minFilter === 'linear') this.minFilter = 'linear';
        } else {
            if (this.minFilter === 'linear') this.minFilter = 'linear';
        }

        // TODO: support cube maps
        // ktx.numberOfFaces
    }
}

function KhronosTextureContainer(buffer) {
    const idCheck = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];
    const id = new Uint8Array(buffer, 0, 12);
    for (let i = 0; i < id.length; i++) if (id[i] !== idCheck[i]) return console.error('File missing KTX identifier');

    // TODO: Is this always 4? Tested: [android, macos]
    const size = Uint32Array.BYTES_PER_ELEMENT;
    const head = new DataView(buffer, 12, 13 * size);
    const littleEndian = head.getUint32(0, true) === 0x04030201;
    const glType = head.getUint32(1 * size, littleEndian);
    if (glType !== 0) return console.warn('only compressed formats currently supported');
    this.glInternalFormat = head.getUint32(4 * size, littleEndian);
    let width = head.getUint32(6 * size, littleEndian);
    let height = head.getUint32(7 * size, littleEndian);
    this.numberOfFaces = head.getUint32(10 * size, littleEndian);
    this.numberOfMipmapLevels = Math.max(1, head.getUint32(11 * size, littleEndian));
    const bytesOfKeyValueData = head.getUint32(12 * size, littleEndian);

    this.mipmaps = [];
    let offset = 12 + 13 * 4 + bytesOfKeyValueData;
    for (let level = 0; level < this.numberOfMipmapLevels; level++) {
        const levelSize = new Int32Array(buffer, offset, 1)[0]; // size per face, since not supporting array cubemaps
        offset += 4; // levelSize field
        for (let face = 0; face < this.numberOfFaces; face++) {
            const data = new Uint8Array(buffer, offset, levelSize);
            this.mipmaps.push({ data, width, height });
            offset += levelSize;
            offset += 3 - ((levelSize + 3) % 4); // add padding for odd sized image
        }
        width = width >> 1;
        height = height >> 1;
    }
}
