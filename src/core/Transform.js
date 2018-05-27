import {Vec3} from '../math/Vec3.js';
import {Quat} from '../math/Quat.js';
import {Mat3} from '../math/Mat3.js';
import {Mat4} from '../math/Mat4.js';
import {Euler} from '../math/Euler.js';

export class Transform {
    constructor(gl, {
    } = {}) {
        this.parent = null;
        this.children = [];

        this.matrix = new Mat4();
        this.worldMatrix = new Mat4();
        this.modelViewMatrix = new Mat4();
        this.normalMatrix = new Mat3();
        this.matrixAutoUpdate = true;

        this.position = new Vec3();
        this.quaternion = new Quat();
        this.scale = new Vec3([1, 1, 1]);
        this.rotation = new Euler();
        this.up = new Vec3([0, 1, 0]);

        this.rotation.onChange = () => this.quaternion.fromEuler(this.rotation);
        this.quaternion.onChange = () => this.rotation.fromQuaternion(this.quaternion);
    }

    setParent(parent, notifyChild = true) {
        if (!parent && notifyChild) this.parent.removeChild(this, false);
        this.parent = parent;
        if (parent && notifyChild) parent.addChild(this, false);
    }

    addChild(child, notifyParent = true) {
        if (!~this.children.indexOf(child)) this.children.push(child);
        if (notifyParent) child.setParent(this, false);
    }

    removeChild(child, notifyParent = true) {
        if (!!~this.children.indexOf(child)) this.children.splice(this.children.indexOf(child), 1);
        if (notifyParent) child.setParent(null, false);
    }

    updateMatrixWorld(force) {
        if (this.matrixAutoUpdate) this.updateMatrix();
        if (this.worldMatrixNeedsUpdate || force) {
            if (this.parent === null) this.worldMatrix.copy(this.matrix);
            else this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix);
            this.worldMatrixNeedsUpdate = false;
            force = true;
        }

        let children = this.children;
        for (let i = 0, l = children.length; i < l; i ++) {
            children[i].updateMatrixWorld(force);
        }
    }

    updateMatrix() {
        this.matrix.compose(this.quaternion, this.position, this.scale);
        this.worldMatrixNeedsUpdate = true;
    }

    traverse(callback) {
        callback(this);
        for (let i = 0, l = this.children.length; i < l; i ++) {
            this.children[i].traverse(callback);
        }
    }

    decompose() {
        this.matrix.getTranslation(this.position);
        this.matrix.getRotation(this.quaternion);
        this.matrix.getScaling(this.scale);
        this.rotation.fromQuaternion(this.quaternion);
    }

    lookAt(target, invert = false) {
        if (invert) this.matrix.lookAt(this.position, target, this.up);
        else this.matrix.lookAt(target, this.position, this.up);
        this.matrix.getRotation(this.quaternion);
        this.rotation.fromQuaternion(this.quaternion);
    };
}