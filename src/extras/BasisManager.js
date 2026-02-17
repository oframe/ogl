let supportedFormat;
let id = 0;

export class BasisManager {
    constructor(workerSrc, gpu) {
        if (!supportedFormat) supportedFormat = this.getSupportedFormat(gpu);
        this.onMessage = this.onMessage.bind(this);
        this.queue = new Map();
        this.initWorker(workerSrc);
    }

    getSupportedFormat(gpu) {
        const device = (gpu.renderer || gpu).device;
        const features = device.features;

        if (features.has('texture-compression-astc')) {
            return 'astc';
        } else if (features.has('texture-compression-bc')) {
            return 'bptc'; // Prefer BC7 (higher quality than BC1/BC3)
        } else if (features.has('texture-compression-etc2')) {
            return 'etc2';
        }
        return 'none';
    }

    initWorker(workerSrc) {
        this.worker = new Worker(workerSrc);
        this.worker.onmessage = this.onMessage;
    }

    onMessage({ data }) {
        const { id, error, image, isCompressedTexture, internalFormat, width, height } = data;
        if (error) {
            console.log(error, id);
            return;
        }
        const textureResolve = this.queue.get(id);
        this.queue.delete(id);
        // Reconstruct properties lost during structured clone (postMessage strips custom props from arrays/TypedArrays)
        image.isBasis = true;
        image.isCompressedTexture = isCompressedTexture;
        image.internalFormat = internalFormat;
        if (!isCompressedTexture) {
            image.width = width;
            image.height = height;
        }
        textureResolve(image);
    }

    parseTexture(buffer) {
        id++;
        this.worker.postMessage({
            id,
            buffer,
            supportedFormat,
        });
        let textureResolve;
        const promise = new Promise((res) => (textureResolve = res));
        this.queue.set(id, textureResolve);
        return promise;
    }
}
