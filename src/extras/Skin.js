import { Mesh } from '../core/Mesh.js';
import { Transform } from '../core/Transform.js';
import { Mat4 } from '../math/Mat4.js';
import { Texture } from '../core/Texture.js';
import { Animation } from './Animation.js';

const tempMat4 = /* @__PURE__ */ new Mat4();

export class Skin extends Mesh {
    constructor(gpu, { rig, geometry, program } = {}) {
        super(gpu, { geometry, program });

        this.createBones(rig);
        this.createBoneTexture();
        this.animations = [];

        // Set uniform values (uniforms must be pre-declared in Program)
        if (this.program.uniforms.boneTexture) {
            this.program.uniforms.boneTexture.value = this.boneTexture;
        }
        if (this.program.uniforms.boneTextureSize) {
            this.program.uniforms.boneTextureSize.value = this.boneTextureSize;
        }
    }

    createBones(rig) {
        // Create root so that can simply update world matrix of whole skeleton
        this.root = new Transform();

        // Create bones
        this.bones = [];
        if (!rig.bones || !rig.bones.length) return;
        for (let i = 0; i < rig.bones.length; i++) {
            const bone = new Transform();

            // Set initial values (bind pose)
            bone.position.fromArray(rig.bindPose.position, i * 3);
            bone.quaternion.fromArray(rig.bindPose.quaternion, i * 4);
            bone.scale.fromArray(rig.bindPose.scale, i * 3);

            this.bones.push(bone);
        }

        // Once created, set the hierarchy
        rig.bones.forEach((data, i) => {
            this.bones[i].name = data.name;
            if (data.parent === -1) return this.bones[i].setParent(this.root);
            this.bones[i].setParent(this.bones[data.parent]);
        });

        // Then update to calculate world matrices
        this.root.updateMatrixWorld(true);

        // Store inverse of bind pose to calculate differences
        this.bones.forEach((bone) => {
            bone.bindInverse = new Mat4(...bone.worldMatrix).inverse();
        });
    }

    createBoneTexture() {
        if (!this.bones.length) return;
        const size = Math.max(4, Math.pow(2, Math.ceil(Math.log(Math.sqrt(this.bones.length * 4)) / Math.LN2)));
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

    addAnimation(data) {
        const animation = new Animation({ objects: this.bones, data });
        this.animations.push(animation);
        return animation;
    }

    update() {
        // Calculate combined animation weight
        let total = 0;
        this.animations.forEach((animation) => (total += animation.weight));

        this.animations.forEach((animation, i) => {
            // force first animation to set in order to reset frame
            animation.update(total, i === 0);
        });
    }

    draw({ camera, passEncoder } = {}) {
        // Update world matrices manually, as not part of scene graph
        this.root.updateMatrixWorld(true);

        // Update bone texture
        this.bones.forEach((bone, i) => {
            // Find difference between current and bind pose
            tempMat4.multiply(bone.worldMatrix, bone.bindInverse);
            this.boneMatrices.set(tempMat4, i * 16);
        });

        // Direct upload without recreating texture
        if (this.boneTexture) {
            const bytesPerRow = this.boneTextureSize * 4 * 4; // rgba32float = 16 bytes per pixel
            this.device.queue.writeTexture(
                { texture: this.boneTexture.gpuTexture },
                this.boneMatrices,
                { bytesPerRow, rowsPerImage: this.boneTextureSize },
                [this.boneTextureSize, this.boneTextureSize]
            );
        }

        super.draw({ camera, passEncoder });
    }
}
