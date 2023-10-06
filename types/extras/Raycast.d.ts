import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';

import type { Vec2Tuple } from '../math/Vec2.js';
import type { Bounds } from '../core/Geometry.js';
import type { Camera } from '../core/Camera.js';
import type { Mesh } from '../core/Mesh.js';

/**
 * A class to assist with {@link https://en.wikipedia.org/wiki/Ray_casting | raycasting}.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Raycast.js | Source}
 */
export class Raycast {
    origin: Vec3;
    direction: Vec3;

    constructor();

    castMouse(camera: Camera, mouse?: Vec2 | Vec2Tuple): void;

    intersectBounds(meshes: Mesh | Mesh[], options?: { maxDistance?: number; output?: Mesh[] }): Mesh[];

    intersectMeshes(
        meshes: Mesh[],
        options?: {
            cullFace?: boolean;
            maxDistance?: number;
            includeUV?: boolean;
            includeNormal?: boolean;
            output?: Mesh[];
        },
    ): Mesh[];

    intersectPlane(plane: { origin: Vec3; normal: Vec3 }, origin?: Vec3, direction?: Vec3): Vec3;

    intersectSphere(sphere: Bounds, origin?: Vec3, direction?: Vec3): number;

    intersectBox(box: Bounds, origin?: Vec3, direction?: Vec3): number;

    intersectTriangle(a: Vec3, b: Vec3, c: Vec3, backfaceCulling?: boolean, origin?: Vec3, direction?: Vec3, normal?: Vec3): number;

    getBarycoord(point: Vec3, a: Vec3, b: Vec3, c: Vec3, target?: Vec3): Vec3;
}
