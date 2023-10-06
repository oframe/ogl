import { Mesh } from '../core/Mesh.js';

/**
 * A special version of {@link Mesh | Mesh} with instanced frustum culling.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/InstancedMesh.js | Source}
 */
export class InstancedMesh extends Mesh {
    readonly isInstancedMesh: true;

    addFrustumCull(): void;

    removeFrustumCull(): void;
}
