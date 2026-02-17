import { Vec3 } from '../math/Vec3.js';

const tempVec3 = /* @__PURE__ */ new Vec3();

let ID = 1;
let ATTR_ID = 1;

let isBoundsWarned = false;

// Map TypedArray + size to WebGPU vertex format
function getVertexFormat(data, size) {
    if (data instanceof Float32Array) {
        return ['float32', 'float32x2', 'float32x3', 'float32x4'][size - 1];
    }
    if (data instanceof Uint8Array) {
        return ['uint8x2', 'uint8x2', 'uint8x4', 'uint8x4'][size - 1];
    }
    if (data instanceof Int8Array) {
        return ['sint8x2', 'sint8x2', 'sint8x4', 'sint8x4'][size - 1];
    }
    if (data instanceof Uint16Array) {
        return ['uint16x2', 'uint16x2', 'uint16x4', 'uint16x4'][size - 1];
    }
    if (data instanceof Int16Array) {
        return ['sint16x2', 'sint16x2', 'sint16x4', 'sint16x4'][size - 1];
    }
    if (data instanceof Uint32Array) {
        return ['uint32', 'uint32x2', 'uint32x3', 'uint32x4'][size - 1];
    }
    if (data instanceof Int32Array) {
        return ['sint32', 'sint32x2', 'sint32x3', 'sint32x4'][size - 1];
    }
    return 'float32x' + size;
}

function getIndexFormat(data) {
    if (data instanceof Uint32Array) return 'uint32';
    return 'uint16';
}

export class Geometry {
    constructor(gpu, attributes = {}) {
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        this.attributes = {};
        this.id = ID++;

        this.drawRange = { start: 0, count: 0 };
        this.instancedCount = 0;
        this.isInstanced = false;

        // Vertex layout caching
        this._cachedLayouts = null;
        this._layoutKey = null;

        for (let key in attributes) {
            this.addAttribute(key, attributes[key]);
        }
    }

    addAttribute(key, attr) {
        this.attributes[key] = attr;

        // Invalidate cached layouts
        this._cachedLayouts = null;
        this._layoutKey = null;

        attr.id = ATTR_ID++;
        attr.size = attr.size || 1;
        attr.normalized = attr.normalized || false;
        attr.stride = attr.stride || 0;
        attr.offset = attr.offset || 0;
        attr.count = attr.count || (attr.stride ? attr.data.byteLength / attr.stride : attr.data.length / attr.size);
        attr.divisor = attr.instanced || 0;
        attr.needsUpdate = false;

        if (key === 'index') {
            attr.indexFormat = getIndexFormat(attr.data);
        } else {
            attr.format = getVertexFormat(attr.data, attr.size);
        }

        // Create GPU buffer
        if (!attr.buffer) {
            this.createBuffer(key, attr);
        }

        // Update counts
        if (attr.divisor) {
            this.isInstanced = true;
            if (this.instancedCount && this.instancedCount !== attr.count * attr.divisor) {
                console.warn('geometry has multiple instanced buffers of different length');
                return (this.instancedCount = Math.min(this.instancedCount, attr.count * attr.divisor));
            }
            this.instancedCount = attr.count * attr.divisor;
        } else if (key === 'index') {
            this.drawRange.count = attr.count;
        } else if (!this.attributes.index) {
            this.drawRange.count = Math.max(this.drawRange.count, attr.count);
        }
    }

    createBuffer(key, attr) {
        const usage = key === 'index' ? GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST : GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        // Buffer size must be multiple of 4
        const size = Math.ceil(attr.data.byteLength / 4) * 4;
        attr.buffer = this.device.createBuffer({ size, usage, mappedAtCreation: true });
        new attr.data.constructor(attr.buffer.getMappedRange()).set(attr.data);
        attr.buffer.unmap();
    }

    updateAttribute(attr) {
        this.device.queue.writeBuffer(attr.buffer, 0, attr.data);
        attr.needsUpdate = false;
    }

    setIndex(value) {
        this.addAttribute('index', value);
    }

    setDrawRange(start, count) {
        this.drawRange.start = start;
        this.drawRange.count = count;
    }

    setInstancedCount(value) {
        this.instancedCount = value;
    }

    getVertexBufferLayouts() {
        if (this._cachedLayouts) return this._cachedLayouts;

        const layouts = [];
        let slot = 0;

        for (let key in this.attributes) {
            if (key === 'index') continue;
            const attr = this.attributes[key];

            const bytesPerElement = attr.data.BYTES_PER_ELEMENT;
            const arrayStride = attr.stride || attr.size * bytesPerElement;

            layouts.push({
                arrayStride,
                stepMode: attr.divisor ? 'instance' : 'vertex',
                attributes: [
                    {
                        shaderLocation: slot,
                        offset: attr.offset,
                        format: attr.format,
                    },
                ],
            });

            // Store slot mapping for draw time
            attr.slot = slot;
            slot++;
        }

        this._cachedLayouts = layouts;
        return layouts;
    }

    getLayoutKey() {
        if (this._layoutKey) return this._layoutKey;
        this._layoutKey = JSON.stringify(this.getVertexBufferLayouts());
        return this._layoutKey;
    }

    draw({ passEncoder, renderState }) {
        // Skip redundant vertex/index buffer binds when same geometry is already bound
        const needsBind = !renderState || renderState.geometry !== this;

        for (let key in this.attributes) {
            if (key === 'index') continue;
            const attr = this.attributes[key];
            if (attr.needsUpdate) this.updateAttribute(attr);
            if (needsBind) passEncoder.setVertexBuffer(attr.slot, attr.buffer);
        }

        if (this.attributes.index) {
            const index = this.attributes.index;
            if (index.needsUpdate) this.updateAttribute(index);
            if (needsBind) passEncoder.setIndexBuffer(index.buffer, index.indexFormat);

            if (this.isInstanced) {
                passEncoder.drawIndexed(this.drawRange.count, this.instancedCount, this.drawRange.start);
            } else {
                passEncoder.drawIndexed(this.drawRange.count, 1, this.drawRange.start);
            }
        } else {
            if (this.isInstanced) {
                passEncoder.draw(this.drawRange.count, this.instancedCount, this.drawRange.start);
            } else {
                passEncoder.draw(this.drawRange.count, 1, this.drawRange.start);
            }
        }

        if (renderState) renderState.geometry = this;
    }

    getPosition() {
        const attr = this.attributes.position;
        if (attr?.data) return attr;
        if (isBoundsWarned) return;
        console.warn('No position buffer data found to compute bounds');
        return (isBoundsWarned = true);
    }

    computeBoundingBox(attr) {
        if (!attr) attr = this.getPosition();
        const array = attr.data;
        const stride = attr.size;

        if (!this.bounds) {
            this.bounds = {
                min: new Vec3(),
                max: new Vec3(),
                center: new Vec3(),
                scale: new Vec3(),
                radius: Infinity,
            };
        }

        const min = this.bounds.min;
        const max = this.bounds.max;
        const center = this.bounds.center;
        const scale = this.bounds.scale;

        min.set(+Infinity);
        max.set(-Infinity);

        for (let i = 0, l = array.length; i < l; i += stride) {
            const x = array[i];
            const y = array[i + 1];
            const z = array[i + 2];

            min.x = Math.min(x, min.x);
            min.y = Math.min(y, min.y);
            min.z = Math.min(z, min.z);

            max.x = Math.max(x, max.x);
            max.y = Math.max(y, max.y);
            max.z = Math.max(z, max.z);
        }

        scale.sub(max, min);
        center.add(min, max).divide(2);
    }

    computeBoundingSphere(attr) {
        if (!attr) attr = this.getPosition();
        const array = attr.data;
        const stride = attr.size;

        if (!this.bounds) this.computeBoundingBox(attr);

        let maxRadiusSq = 0;
        for (let i = 0, l = array.length; i < l; i += stride) {
            tempVec3.fromArray(array, i);
            maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistance(tempVec3));
        }

        this.bounds.radius = Math.sqrt(maxRadiusSq);
    }

    remove() {
        for (let key in this.attributes) {
            if (this.attributes[key].buffer) {
                this.attributes[key].buffer.destroy();
            }
            delete this.attributes[key];
        }
    }
}
