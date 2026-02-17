import { Mesh } from '../core/Mesh.js';
import { Mat4 } from '../math/Mat4.js';
import { Texture } from '../core/Texture.js';

const tempMat4 = /* @__PURE__ */ new Mat4();
const identity = /* @__PURE__ */ new Mat4();

export class GLTFSkin extends Mesh {
    constructor(gpu, { skeleton, geometry, program } = {}) {
        super(gpu, { geometry, program });
        this.skeleton = skeleton;
        this.program = program;
        this.createBoneTexture();
    }

    createBoneTexture() {
        if (!this.skeleton.joints.length) return;
        const size = Math.max(4, Math.pow(2, Math.ceil(Math.log(Math.sqrt(this.skeleton.joints.length * 4)) / Math.LN2)));
        this.boneMatrices = new Float32Array(size * size * 4);
        this.boneTextureSize = size;
        this.boneTexture = new Texture(this.renderer, {
            image: this.boneMatrices,
            generateMipmaps: false,
            format: 'rgba32float',
            minFilter: 'nearest',
            magFilter: 'nearest',
            flipY: false,
            width: size,
            height: size,
        });
    }

    updateUniforms() {
        // Update bone texture
        this.skeleton.joints.forEach((bone, i) => {
            // Find difference between current and bind pose
            tempMat4.multiply(bone.worldMatrix, bone.bindInverse);
            this.boneMatrices.set(tempMat4, i * 16);
        });

        // Write bone matrices directly to GPU texture
        const bytesPerRow = this.boneTextureSize * 4 * 4; // rgba32float = 16 bytes per pixel
        this.device.queue.writeTexture(
            { texture: this.boneTexture.gpuTexture },
            this.boneMatrices,
            { bytesPerRow, rowsPerImage: this.boneTextureSize },
            [this.boneTextureSize, this.boneTextureSize]
        );
    }

    draw({ camera, passEncoder } = {}) {
        this.updateUniforms();

        // Switch the world matrix with identity to ignore any transforms
        // on the mesh itself - only use skeleton's transforms
        const _worldMatrix = this.worldMatrix;
        this.worldMatrix = identity;

        super.draw({ camera, passEncoder });

        // Switch back to leave identity untouched
        this.worldMatrix = _worldMatrix;
    }
}
