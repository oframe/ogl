// TODO: add barycentric ?

import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';

const tempVec3a = new Vec3();
const tempVec3b = new Vec3();
const tempVec3c = new Vec3();
const tempMat4 = new Mat4();

export class Raycast {
    constructor(gl) {
        this.gl = gl;

        this.origin = new Vec3();
        this.direction = new Vec3();
    }

    // Set ray from mouse unprojection
    castMouse(camera, mouse = [0, 0]) {
        if (camera.type === 'orthographic') {
            // Set origin
            // Since camera is orthographic, origin is not the camera position
            const { left, right, bottom, top, zoom } = camera;
            const x = left / zoom + ((right - left) / zoom) * (mouse[0] * 0.5 + 0.5);
            const y = bottom / zoom + ((top - bottom) / zoom) * (mouse[1] * 0.5 + 0.5);
            this.origin.set(x, y, 0);
            this.origin.applyMatrix4(camera.worldMatrix);

            // Set direction
            // https://community.khronos.org/t/get-direction-from-transformation-matrix-or-quat/65502/2
            this.direction.x = -camera.worldMatrix[8];
            this.direction.y = -camera.worldMatrix[9];
            this.direction.z = -camera.worldMatrix[10];
        } else {
            // Set origin
            camera.worldMatrix.getTranslation(this.origin);

            // Set direction
            this.direction.set(mouse[0], mouse[1], 0.5);
            camera.unproject(this.direction);
            this.direction.sub(this.origin).normalize();
        }
    }

    intersectBounds(meshes) {
        if (!Array.isArray(meshes)) meshes = [meshes];

        const invWorldMat4 = tempMat4;
        const origin = tempVec3a;
        const direction = tempVec3b;

        const hits = [];

        meshes.forEach((mesh) => {
            // Create bounds
            if (!mesh.geometry.bounds) mesh.geometry.computeBoundingBox();
            if (mesh.geometry.raycast === 'sphere' && mesh.geometry.bounds.radius === Infinity) mesh.geometry.computeBoundingSphere();

            // Take world space ray and make it object space to align with bounding box
            invWorldMat4.inverse(mesh.worldMatrix);
            origin.copy(this.origin).applyMatrix4(invWorldMat4);
            direction.copy(this.direction).transformDirection(invWorldMat4);

            let localDistance = 0;
            if (mesh.geometry.raycast === 'sphere') {
                localDistance = this.intersectSphere(mesh.geometry.bounds, origin, direction);
            } else {
                localDistance = this.intersectBox(mesh.geometry.bounds, origin, direction);
            }
            if (!localDistance) return;

            // Create object on mesh to avoid generating lots of objects
            if (!mesh.hit) mesh.hit = { localPoint: new Vec3(), point: new Vec3() };

            mesh.hit.localPoint.copy(direction).multiply(localDistance).add(origin);
            mesh.hit.point.copy(mesh.hit.localPoint).applyMatrix4(mesh.worldMatrix);
            mesh.hit.distance = mesh.hit.point.distance(this.origin);

            hits.push(mesh);
        });

        hits.sort((a, b) => a.hit.distance - b.hit.distance);
        return hits;
    }

    intersectSphere(sphere, origin = this.origin, direction = this.direction) {
        const ray = tempVec3c;
        ray.sub(sphere.center, origin);
        const tca = ray.dot(direction);
        const d2 = ray.dot(ray) - tca * tca;
        const radius2 = sphere.radius * sphere.radius;

        if (d2 > radius2) return 0;

        const thc = Math.sqrt(radius2 - d2);
        const t0 = tca - thc;
        const t1 = tca + thc;

        if (t0 < 0 && t1 < 0) return 0;

        if (t0 < 0) return t1;

        return t0;
    }

    // Ray AABB - Ray Axis aligned bounding box testing
    intersectBox(box, origin = this.origin, direction = this.direction) {
        let tmin, tmax, tYmin, tYmax, tZmin, tZmax;

        const invdirx = 1 / direction.x;
        const invdiry = 1 / direction.y;
        const invdirz = 1 / direction.z;

        const min = box.min;
        const max = box.max;

        tmin = ((invdirx >= 0 ? min.x : max.x) - origin.x) * invdirx;
        tmax = ((invdirx >= 0 ? max.x : min.x) - origin.x) * invdirx;

        tYmin = ((invdiry >= 0 ? min.y : max.y) - origin.y) * invdiry;
        tYmax = ((invdiry >= 0 ? max.y : min.y) - origin.y) * invdiry;

        if (tmin > tYmax || tYmin > tmax) return 0;

        if (tYmin > tmin) tmin = tYmin;
        if (tYmax < tmax) tmax = tYmax;

        tZmin = ((invdirz >= 0 ? min.z : max.z) - origin.z) * invdirz;
        tZmax = ((invdirz >= 0 ? max.z : min.z) - origin.z) * invdirz;

        if (tmin > tZmax || tZmin > tmax) return 0;
        if (tZmin > tmin) tmin = tZmin;
        if (tZmax < tmax) tmax = tZmax;

        if (tmax < 0) return 0;

        return tmin >= 0 ? tmin : tmax;
    }
}
