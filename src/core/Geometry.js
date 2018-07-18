// attribute params
// {
//     data - typed array eg UInt16Array for indices, Float32Array
//     size - int default 1
//     instanced - boolean default false. can pass true or divisor amount
//     type - gl enum default gl.UNSIGNED_SHORT for 'index', gl.FLOAT for others
//     normalize - boolean default false
// }

// TODO: fit in transform feedback
// TODO: bounding box for auto culling
// this.boundingBox.center

// TODO: when would I disableVertexAttribArray ?
// TODO: do I need to unbind after drawing ?
// TODO: test updating attributes on the fly

let ID = 0;

export class Geometry {
    constructor(gl, attributes = {}) {
        this.gl = gl;
        this.attributes = attributes;
        this.id = ID++;

        this.drawRange = {start: 0, count: 0};
        this.instancedCount = 0;

        // Unbind current VAO so that new buffers don't get added to active mesh
        this.gl.renderer.bindVertexArray(null);
        this.gl.renderer.currentGeometry = null;

        // create the buffers
        for (let key in attributes) {
            this.addAttribute(key, attributes[key]);
        }
    }

    addAttribute(key, attr) {
        this.attributes[key] = attr;

        // Set options
        attr.size = attr.size || 1;
        attr.type = attr.type || key === 'index' ? this.gl.UNSIGNED_SHORT : this.gl.FLOAT;
        attr.target = key === 'index' ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
        attr.normalize = attr.normalize || false;
        attr.buffer = this.gl.createBuffer();
        attr.count = attr.data.length / attr.size;
        attr.divisor = !attr.instanced ? 0 : typeof attr.instanced === 'number' ? attr.instanced : 1;

        // Push data to buffer
        this.updateAttribute(attr);

        // Update geometry counts. If indexed, ignore regular attributes
        if (attr.divisor) {
            this.isInstanced = true;
            if (this.instancedCount && this.instancedCount !== attr.count * attr.divisor) {
                console.warn('geometry has multiple instanced buffers of different length');
                return this.instancedCount = Math.min(this.instancedCount, attr.count * attr.divisor);
            }
            this.instancedCount = attr.count * attr.divisor;
        } else if (key === 'index') {
            this.drawRange.count = attr.count;
        } else if (!this.attributes.index) {
            this.drawRange.count = Math.max(this.drawRange.count, attr.count);
        }
    }

    updateAttribute(attr) {
        this.gl.bindBuffer(attr.target, attr.buffer);
        this.gl.bufferData(attr.target, attr.data, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(attr.target, null);
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

    createVAO(program) {
        this.vao = this.gl.renderer.createVertexArray();
        this.gl.renderer.bindVertexArray(this.vao);
        this.bindAttributes(program);
    }

    bindAttributes(program) {

        // Link all attributes to program using gl.vertexAttribPointer
        program.attributeLocations.forEach((location, name) => {

            // If geometry missing a required shader attribute
            if (!this.attributes[name]) {
                console.warn(`active attribute ${name} not being supplied`);
                return;
            }

            const attr = this.attributes[name];

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attr.buffer);
            this.gl.vertexAttribPointer(
                location,
                attr.size,
                attr.type,
                attr.normalize,
                0, // stride
                0 // offset
            );
            this.gl.enableVertexAttribArray(location);

            // For instanced attributes, divisor needs to be set.
            // For firefox, need to set back to 0 if non-instanced drawn after instanced. Else won't render
            this.gl.renderer.vertexAttribDivisor(location, attr.divisor);
        });

        // Bind indices if geometry indexed
        if (this.attributes.index) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
    }

    draw({
        program,
        mode = this.gl.TRIANGLES,
        geometryBound = false,
    }) {
        if (!geometryBound) {

            // Create VAO on first draw. Needs to wait for program to get attribute locations
            if (!this.vao) this.createVAO(program);

            // TODO: add fallback for non vao support (ie)

            // Bind if not already bound to program
            this.gl.renderer.bindVertexArray(this.vao);

            // Store so doesn't bind redundantly
            this.gl.renderer.currentGeometry = this.id;
        }

        if (this.isInstanced) {
            if (this.attributes.index) {
                this.gl.renderer.drawElementsInstanced(mode, this.drawRange.count, this.attributes.index.type, this.drawRange.start, this.instancedCount);
            } else {
                this.gl.renderer.drawArraysInstanced(mode, this.drawRange.start, this.drawRange.count, this.instancedCount);
            }
        } else {
            if (this.attributes.index) {
                this.gl.drawElements(mode, this.drawRange.count, this.attributes.index.type, this.drawRange.start);
            } else {
                this.gl.drawArrays(mode, this.drawRange.start, this.drawRange.count);
            }
        }
    }

    remove() {
        if (this.vao) this.gl.renderer.deleteVertexArray(this.vao);
        for (let key in this.attributes) {
            this.gl.deleteBuffer(this.attributes[key].buffer);
            delete this.attributes[key];

        }
    }
}