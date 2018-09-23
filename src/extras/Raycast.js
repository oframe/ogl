// TODO: orthographic

import {Vec3} from '../math/Vec3.js';
import {Mat4} from '../math/Mat4.js';
import {Quat} from '../math/Quat.js';

const tempVec3a = new Vec3();
const tempVec3b = new Vec3();
const tempMat4 = new Mat4();
const tempQuat = new Quat();

export class Raycast {
    constructor(gl) {
        this.gl = gl;

        this.origin = new Vec3();
        this.direction = new Vec3();
    }

    // Set ray from mouse unprojection
    castMouse(camera, mouse = [0, 0]) {

        // Set origin
        camera.worldMatrix.getTranslation(this.origin);
        
        // Set direction
        this.direction.set(mouse[0], mouse[1], 0.5);
        camera.unproject(this.direction);
        this.direction.sub(this.origin).normalize();
    }

    intersectBoxes(meshes) {
        if (!Array.isArray(meshes)) meshes = [meshes];

        const invWorldMat4 = tempMat4;
        const invWorldQuat = tempQuat;
        const origin = tempVec3a;
        const direction = tempVec3b;

        const hits = [];

        meshes.forEach(mesh => {
            if (!mesh.bounds) mesh.computeBoundingBox();

            // Take world space ray and make it object space to align with bounding box
            invWorldMat4.inverse(mesh.worldMatrix);
            invWorldMat4.getRotation(invWorldQuat);
            origin.copy(this.origin).applyMatrix4(invWorldMat4);
            direction.copy(this.direction).applyQuaternion(invWorldQuat);

            const distance = this.intersectBox(mesh.bounds, origin, direction);
            if (!distance) return;

            // Create object on mesh to avoid generating lots of objects
            if (!mesh.hit) mesh.hit = {localPoint: new Vec3()};

            mesh.hit.distance = distance;
            mesh.hit.localPoint.copy(direction).multiply(distance).add(origin);

            hits.push(mesh);
        });

        hits.sort((a, b) => a.hit.distance - b.hit.distance);
        return hits;
    }

    intersectSphere() {
        // Intersecting spheres takes less matrix calculation than boxes 
    }

    // AABB - Axis aligned bounding box testing
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
    
        if ((tmin > tYmax) || (tYmin > tmax)) return null;
    
        // These lines also handle the case where tmin or tmax is NaN
        // (result of 0 * Infinity). x !== x returns true if x is NaN
        if ( tYmin > tmin || tmin !== tmin ) tmin = tYmin;
        if ( tYmax < tmax || tmax !== tmax ) tmax = tYmax;
    
        tZmin = ((invdirz >= 0 ? min.z : max.z) - origin.z) * invdirz;
        tZmax = ((invdirz >= 0 ? max.z : min.z) - origin.z) * invdirz;
    
        if ((tmin > tZmax) || (tZmin > tmax)) return null;
        if (tZmin > tmin || tmin !== tmin) tmin = tZmin;
        if (tZmax < tmax || tmax !== tmax) tmax = tZmax;
    
        //return point closest to the ray (positive side)
        if (tmax < 0) return null;

        const t = tmin >= 0 ? tmin : tmax;
        return t;
        // return target.copy(this.direction).multiplyScalar(t).add(this.origin);
        // return this.at( tmin >= 0 ? tmin : tmax, target );
    }
}



