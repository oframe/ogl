import {Transform} from './Transform.js';
import {Mat4} from '../math/Mat4.js';
import {Vec3} from '../math/Vec3.js';

const tempMat4 = new Mat4();
const tempVec3a = new Vec3();
const tempVec3b = new Vec3();

export class Camera extends Transform {
    constructor(gl, {
        near = 0.1,
        far = 100,
        fov = 45,
        aspect = 1,
        left,
        right,
        bottom,
        top,

    } = {}) {
        super(gl);

        this.near = near;
        this.far = far;
        this.fov = fov;
        this.aspect = aspect;

        this.projectionMatrix = new Mat4();
        this.viewMatrix = new Mat4();
        this.projectionViewMatrix = new Mat4();

        // Use orthographic if values set, else default to perspective camera
        if (left || right) this.orthographic({left, right, bottom, top});
        else this.perspective();
    }

    perspective({
        near = this.near,
        far = this.far,
        fov = this.fov,
        aspect = this.aspect,
    } = {}) {
        this.projectionMatrix.fromPerspective({fov: fov * (Math.PI / 180), aspect, near, far});
        this.type = 'perspective';
        return this;
    }

    orthographic({
        near = this.near,
        far = this.far,
        left = -1,
        right = 1,
        bottom = -1,
        top = 1,
    } = {}) {
        this.projectionMatrix.fromOrthogonal({left, right, bottom, top, near, far});
        this.type = 'orthographic';
        return this;
    }

    updateMatrixWorld() {
        super.updateMatrixWorld();
        this.viewMatrix.inverse(this.worldMatrix);
        
        // used for sorting
        this.projectionViewMatrix.multiply(this.projectionMatrix, this.viewMatrix);
        return this;
    }

    lookAt(target) {
        super.lookAt(target, true);
        return this;
    }

    // Project 3D coordinate to 2D point
    project(v) {
        v.applyMatrix4(this.viewMatrix);
        v.applyMatrix4(this.projectionMatrix);
        return this;
    }

    // Unproject 2D point to 3D coordinate
    unproject(v) {
        v.applyMatrix4(tempMat4.inverse(this.projectionMatrix));
        v.applyMatrix4(this.worldMatrix);
        return this;
    }

    updateFrustum() {
        if (!this.frustum) {
            this.frustum = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()];
        }

        const m = this.projectionViewMatrix;
        this.frustum[0].set(m[3] - m[0], m[7] - m[4], m[11] - m[8]).constant = m[15] - m[12]; // -x
        this.frustum[1].set(m[3] + m[0], m[7] + m[4], m[11] + m[8]).constant = m[15] + m[12]; // +x
        this.frustum[2].set(m[3] + m[1], m[7] + m[5], m[11] + m[9]).constant = m[15] + m[13]; // +y
        this.frustum[3].set(m[3] - m[1], m[7] - m[5], m[11] - m[9]).constant = m[15] - m[13]; // -y
        this.frustum[4].set(m[3] - m[2], m[7] - m[6], m[11] - m[10]).constant = m[15] - m[14]; // +z (far)
        this.frustum[5].set(m[3] + m[2], m[7] + m[6], m[11] + m[10]).constant = m[15] + m[14]; // -z (near)

        for (let i = 0; i < 6; i++) {
            const invLen = 1.0 / this.frustum[i].distance();
            this.frustum[i].multiply(invLen);
            this.frustum[i].constant *= invLen;
        }
    }

    frustumIntersectsMesh(node) {

        // If no position attribute, treat as frustumCulled false
        if (!node.geometry.attributes.position) return true;
        
        if (!node.geometry.bounds || node.geometry.bounds.radius === Infinity) node.geometry.computeBoundingSphere();

        const center = tempVec3a;
        center.copy(node.geometry.bounds.center);
        center.applyMatrix4(node.worldMatrix);

        const radius = node.geometry.bounds.radius * node.worldMatrix.getMaxScaleOnAxis();

        return this.frustumIntersectsSphere(center, radius);
    }

    frustumIntersectsSphere(center, radius) {
        const normal = tempVec3b;

		for (let i = 0; i < 6; i++) {
            const plane = this.frustum[i];
            const distance = normal.copy(plane).dot(center) + plane.constant;
			if (distance < -radius) return false;
		}
		return true;
    }
}