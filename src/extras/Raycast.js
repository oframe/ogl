// TODO: maxDistance is compared locally - should be world space
// TODO: barycentric code shouldn't be here, but where?

import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';

const tempVec2a = new Vec2();
const tempVec2b = new Vec2();
const tempVec2c = new Vec2();
const tempVec3a = new Vec3();
const tempVec3b = new Vec3();
const tempVec3c = new Vec3();
const tempVec3d = new Vec3();
const tempVec3e = new Vec3();
const tempVec3f = new Vec3();
const tempVec3g = new Vec3();
const tempVec3h = new Vec3();
const tempVec3i = new Vec3();
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

    intersectBounds(meshes, maxDistance) {
        if (!Array.isArray(meshes)) meshes = [meshes];

        const invWorldMat4 = tempMat4;
        const origin = tempVec3a;
        const direction = tempVec3b;

        const hits = [];

        meshes.forEach((mesh) => {
            // Create bounds
            if (!mesh.geometry.bounds || mesh.geometry.bounds.radius === Infinity)
                mesh.geometry.computeBoundingSphere();
            const bounds = mesh.geometry.bounds;

            // Take world space ray and make it object space to align with bounding box
            invWorldMat4.inverse(mesh.worldMatrix);
            origin.copy(this.origin).applyMatrix4(invWorldMat4);
            direction.copy(this.direction).transformDirection(invWorldMat4);

            // Break out early if bounds too far away from origin
            if (maxDistance) {
                if (origin.distance(bounds.center) - bounds.radius > maxDistance) return;
            }

            let localDistance = 0;
            if (mesh.geometry.raycast === 'sphere') {
                localDistance = this.intersectSphere(bounds, origin, direction);
            } else {
                localDistance = this.intersectBox(bounds, origin, direction);
            }
            if (!localDistance) return;

            if (maxDistance && localDistance > maxDistance) return;

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

    intersectMeshes(meshes, cullFace = true, maxDistance) {
        // Test bounds first before testing geometry
        const hits = this.intersectBounds(meshes, maxDistance);
        if (!hits.length) return hits;

        const invWorldMat4 = tempMat4;
        const origin = tempVec3a;
        const direction = tempVec3b;
        const a = tempVec3c;
        const b = tempVec3d;
        const c = tempVec3e;
        const barycoord = tempVec3f;
        const a2 = tempVec2a;
        const b2 = tempVec2b;
        const c2 = tempVec2c;

        for (let i = hits.length - 1; i >= 0; i--) {
            const mesh = hits[i];

            // Take world space ray and make it object space to align with geometry
            invWorldMat4.inverse(mesh.worldMatrix);
            origin.copy(this.origin).applyMatrix4(invWorldMat4);
            direction.copy(this.direction).transformDirection(invWorldMat4);

            let localDistance = 0;
            let closestA, closestB, closestC;

            const geometry = mesh.geometry;
            const attributes = geometry.attributes;
            const index = attributes.index;

            const start = Math.max(0, geometry.drawRange.start);
            const end = Math.min(
                index ? index.count : attributes.position.count,
                geometry.drawRange.start + geometry.drawRange.count
            );

            for (let j = start; j < end; j += 3) {
                // Position attribute indices for each triangle
                const ai = index ? index.data[j] : j;
                const bi = index ? index.data[j + 1] : j + 1;
                const ci = index ? index.data[j + 2] : j + 2;

                a.fromArray(attributes.position.data, ai * 3);
                b.fromArray(attributes.position.data, bi * 3);
                c.fromArray(attributes.position.data, ci * 3);

                // localDistance = this.intersectTriangle(a, b, c, backfaceCulling, origin, direction);
                const distance = this.intersectTriangle(a, b, c, cullFace, origin, direction);
                if (!distance) continue;

                // Too far away
                if (maxDistance && distance > maxDistance) continue;

                if (!localDistance || distance < localDistance) {
                    localDistance = distance;
                    closestA = ai;
                    closestB = bi;
                    closestC = ci;
                }
            }

            if (!localDistance) hits.splice(i, 1);

            // Update hit values from bounds-test
            mesh.hit.localPoint.copy(direction).multiply(localDistance).add(origin);
            mesh.hit.point.copy(mesh.hit.localPoint).applyMatrix4(mesh.worldMatrix);
            mesh.hit.distance = mesh.hit.point.distance(this.origin);

            // Add unique hit objects on mesh to avoid generating lots of objects
            if (!mesh.hit.uv) {
                mesh.hit.uv = new Vec2();
                mesh.hit.localNormal = new Vec3();
            }

            // Calculate barycoords to find uv and normal values at hit point
            a.fromArray(attributes.position.data, closestA * 3);
            b.fromArray(attributes.position.data, closestB * 3);
            c.fromArray(attributes.position.data, closestC * 3);
            this.getBarycoord(mesh.hit.localPoint, a, b, c, barycoord);

            if (attributes.uv) {
                a2.fromArray(attributes.uv.data, closestA * 2);
                b2.fromArray(attributes.uv.data, closestB * 2);
                c2.fromArray(attributes.uv.data, closestC * 2);
                mesh.hit.uv.set(
                    a2.x * barycoord.x + b2.x * barycoord.y + c2.x * barycoord.z,
                    a2.y * barycoord.x + b2.y * barycoord.y + c2.y * barycoord.z
                );
            }
            if (attributes.normal) {
                a.fromArray(attributes.normal.data, closestA * 3);
                b.fromArray(attributes.normal.data, closestB * 3);
                c.fromArray(attributes.normal.data, closestC * 3);
                mesh.hit.localNormal.set(
                    a.x * barycoord.x + b.x * barycoord.y + c.x * barycoord.z,
                    a.y * barycoord.x + b.y * barycoord.y + c.y * barycoord.z,
                    a.z * barycoord.x + b.z * barycoord.y + c.z * barycoord.z
                );
            }
        }

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

    intersectTriangle(
        a,
        b,
        c,
        backfaceCulling = true,
        origin = this.origin,
        direction = this.direction
    ) {
        // from https://github.com/mrdoob/three.js/blob/master/src/math/Ray.js
        // which is from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

        const edge1 = tempVec3f;
        const edge2 = tempVec3g;
        const normal = tempVec3h;
        const diff = tempVec3i;

        edge1.sub(b, a);
        edge2.sub(c, a);
        normal.cross(edge1, edge2);

        // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
        // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
        //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
        //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
        //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
        let DdN = direction.dot(normal);

        // Parallel
        if (!DdN) return 0;

        let sign;
        if (DdN > 0) {
            if (backfaceCulling) return 0;
            sign = 1;
        } else {
            sign = -1;
            DdN = -DdN;
        }

        diff.sub(origin, a);
        let DdQxE2 = sign * direction.dot(edge2.cross(diff, edge2));

        // b1 < 0, no intersection
        if (DdQxE2 < 0) return 0;

        let DdE1xQ = sign * direction.dot(edge1.cross(diff));

        // b2 < 0, no intersection
        if (DdE1xQ < 0) return 0;

        // b1+b2 > 1, no intersection
        if (DdQxE2 + DdE1xQ > DdN) return 0;

        // Line intersects triangle, check if ray does.
        let QdN = -sign * diff.dot(normal);

        // t < 0, no intersection
        if (QdN < 0) return 0;

        // Ray intersects triangle.
        return QdN / DdN;
    }

    // From https://github.com/mrdoob/three.js/blob/master/src/math/Triangle.js
    // static/instance method to calculate barycentric coordinates
    // based on: http://www.blackpawn.com/texts/pointinpoly/default.html
    getBarycoord(point, a, b, c, target) {
        const v0 = tempVec3g;
        const v1 = tempVec3h;
        const v2 = tempVec3i;

        v0.sub(c, a);
        v1.sub(b, a);
        v2.sub(point, a);

        const dot00 = v0.dot(v0);
        const dot01 = v0.dot(v1);
        const dot02 = v0.dot(v2);
        const dot11 = v1.dot(v1);
        const dot12 = v1.dot(v2);

        const denom = dot00 * dot11 - dot01 * dot01;

        // collinear or singular triangle
        if (denom === 0) {
            // arbitrary location outside of triangle?
            // not sure if this is the best idea, maybe should be returning undefined
            return target.set(-2, -1, -1);
        }

        const invDenom = 1 / denom;
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // barycentric coordinates must always sum to 1
        return target.set(1 - u - v, v, u);
    }
}
