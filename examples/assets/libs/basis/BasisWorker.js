// https://github.com/mrdoob/three.js/tree/dev/examples/js/libs/basis
importScripts('basis_transcoder.js');

let KTX2File, moduleReadyResolve;
const moduleReady = new Promise((res) => (moduleReadyResolve = res));

// CONSTS
const BASIS_FORMAT = {
    ETC1_RGB: 0,
    ETC2_RGBA: 1,
    BC1_RGB: 2,
    BC3_RGBA: 3,
    BC7_RGBA: 6,
    PVRTC1_4_RGB: 8,
    PVRTC1_4_RGBA: 9,
    ASTC_4x4_RGBA: 10,
    // ATC_RGB: 11,
    // ATC_RGBA_INTERPOLATED_ALPHA: 12,
    RGBA32: 13,
    RGB565: 14,
    RGBA4444: 16,
};

const INTERNAL_FORMAT = {
    COMPRESSED_RGB_ETC1_WEBGL: 0x8d64,
    COMPRESSED_RGBA8_ETC2_EAC: 0x9278,
    COMPRESSED_RGB_S3TC_DXT1_EXT: 0x83f0,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 0x83f3,
    COMPRESSED_RGBA_BPTC_UNORM: 0x8e8c,
    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: 0x8c00,
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: 0x8c02,
    COMPRESSED_RGBA_ASTC_4x4_KHR: 0x93b0,
    // COMPRESSED_RGB_ATC_WEBGL: 0x8c92,
    // COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: 0x87ee,
    UNSIGNED_BYTE: 0x1401,
    UNSIGNED_SHORT_5_6_5: 0x8363,
    UNSIGNED_SHORT_4_4_4_4: 0x8033,
};

// Maps supported format to BASIS transcode format
const OPAQUE_MAP = {
    etc2: BASIS_FORMAT.ETC1_RGB,
    astc: BASIS_FORMAT.ASTC_4x4_RGBA,
    bptc: BASIS_FORMAT.BC7_RGBA,
    s3tc: BASIS_FORMAT.BC1_RGB,
    etc1: BASIS_FORMAT.ETC1_RGB,
    pvrtc: BASIS_FORMAT.PVRTC1_4_RGB,
    // atc: BASIS_FORMAT.ATC_RGB,
    none: BASIS_FORMAT.RGB565,
};

const ALPHA_MAP = {
    etc2: BASIS_FORMAT.ETC2_RGBA,
    astc: BASIS_FORMAT.ASTC_4x4_RGBA,
    bptc: BASIS_FORMAT.BC7_RGBA,
    s3tc: BASIS_FORMAT.BC3_RGBA,
    etc1: BASIS_FORMAT.RGBA4444,
    pvrtc: BASIS_FORMAT.PVRTC1_4_RGBA,
    // atc: BASIS_FORMAT.ATC_RGBA_INTERPOLATED_ALPHA,
    none: BASIS_FORMAT.RGBA4444,
};

// Maps BASIS transcode format to compressedTexImage2D internal format
const INTERNAL_FORMAT_MAP = {
    0: INTERNAL_FORMAT.COMPRESSED_RGB_ETC1_WEBGL, // ETC1_RGB
    1: INTERNAL_FORMAT.COMPRESSED_RGBA8_ETC2_EAC, // ETC2_RGBA
    2: INTERNAL_FORMAT.COMPRESSED_RGB_S3TC_DXT1_EXT, // BC1_RGB
    3: INTERNAL_FORMAT.COMPRESSED_RGBA_S3TC_DXT5_EXT, // BC3_RGBA
    6: INTERNAL_FORMAT.COMPRESSED_RGBA_BPTC_UNORM, // BC7_RGBA
    8: INTERNAL_FORMAT.COMPRESSED_RGB_PVRTC_4BPPV1_IMG, // PVRTC1_4_RGB
    9: INTERNAL_FORMAT.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, // PVRTC1_4_RGBA
    10: INTERNAL_FORMAT.COMPRESSED_RGBA_ASTC_4x4_KHR, // ASTC_4x4_RGBA
    // 11: INTERNAL_FORMAT.COMPRESSED_RGB_ATC_WEBGL, // ATC_RGB
    // 12: INTERNAL_FORMAT.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, // ATC_RGBA_INTERPOLATED_ALPHA
    13: INTERNAL_FORMAT.UNSIGNED_BYTE, // RGBA32
    14: INTERNAL_FORMAT.UNSIGNED_SHORT_5_6_5, // RGB565
    16: INTERNAL_FORMAT.UNSIGNED_SHORT_4_4_4_4, // RGBA4444
};

// Init basis transcoder
const initStartTime = performance.now();
BASIS().then((module) => {
    ({ KTX2File } = module);
    module.initializeBasis();
    const elapsed = performance.now() - initStartTime;
    // console.log('worker init time', elapsed.toFixed(2) + 'ms');
    moduleReadyResolve();
});

addEventListener('message', ({ data }) => {
    transcode(data);
});

async function transcode({ id, buffer, supportedFormat }) {
    await moduleReady;

    const startTime = performance.now();
    const ktx2File = new KTX2File(new Uint8Array(buffer));

    const width = ktx2File.getWidth();
    const height = ktx2File.getHeight();
    const levels = ktx2File.getLevels();
    const hasAlpha = ktx2File.getHasAlpha();

    if (!width || !height || !levels) {
        ktx2File.close();
        ktx2File.delete();
        postMessage({ id, error: `Invalid .basis file.` });
        return;
    }

    let basisFormat = hasAlpha ? ALPHA_MAP[supportedFormat] : OPAQUE_MAP[supportedFormat];

    // PVRTC only supports square, po2 textures. Else use uncompressed format.
    if (supportedFormat === 'pvrtc') {
        if ((width & (width - 1)) !== 0 || width !== height) {
            // TODO: should fallback format 16bit ? RGBA4444
            basisFormat = hasAlpha ? BASIS_FORMAT.RGBA32 : BASIS_FORMAT.RGB565;
        }
    }

    if (!ktx2File.startTranscoding()) {
        ktx2File.close();
        ktx2File.delete();
        postMessage({ id, error: 'startTranscoding failed' });
        return;
    }

    const isCompressed = basisFormat < 13; // [13, 14, 16] are uncompressed formats

    let image = [];
    // Don't load mipmaps for uncompressed
    for (let mip = 0; mip < (isCompressed ? levels : 1); ++mip) {
        const dstSize = ktx2File.getImageTranscodedSizeInBytes(mip, 0, 0, basisFormat);
        let dst = new Uint8Array(dstSize);

        if (!ktx2File.transcodeImage(dst, mip, 0, 0, basisFormat, 0, -1, -1)) {
            ktx2File.close();
            ktx2File.delete();
            postMessage({ id, error: 'transcodeImage failed' });
        }

        if (basisFormat === BASIS_FORMAT.RGB565 || basisFormat === BASIS_FORMAT.RGBA4444) {
            // 16 bit formats require Uint16 typed array
            const dst16 = new Uint16Array(dstSize / 2);
            for (i = 0; i < dstSize / 2; ++i) {
                dst16[i] = dst[i * 2] + dst[i * 2 + 1] * 256;
            }
            dst = dst16;
        }

        const levelInfo = ktx2File.getImageLevelInfo(mip, 0, 0);
        const mipWidth = levelInfo.origWidth;
        const mipHeight = levelInfo.origHeight;

        if (isCompressed) {
            image.push({
                data: dst,
                width: mipWidth,
                height: mipHeight,
            });
        } else {
            image = dst;
            image.width = mipWidth;
            image.height = mipHeight;
        }
    }

    ktx2File.close();
    ktx2File.delete();

    const elapsed = performance.now() - startTime;
    // console.log('transcode time', elapsed.toFixed(2) + 'ms');

    // Needed for texture properties
    image.isCompressedTexture = isCompressed;
    image.internalFormat = INTERNAL_FORMAT_MAP[basisFormat];

    postMessage({
        id,
        image,
    });
}
