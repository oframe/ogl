// attribute params
// {
//     data - typed array eg UInt16Array for indices, Float32Array
//     size - int default 1
//     instance - boolean default false
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

        // TODO: maybe attach these to renderer?
        // Get functions that differ between webgl1 and webgl2
        this.vertexAttribDivisor = gl.renderer.getExtension('ANGLE_instanced_arrays', 'vertexAttribDivisor', 'vertexAttribDivisorANGLE');
        this.drawArraysInstanced = gl.renderer.getExtension('ANGLE_instanced_arrays', 'drawArraysInstanced', 'drawArraysInstancedANGLE');
        this.drawElementsInstanced = gl.renderer.getExtension('ANGLE_instanced_arrays', 'drawElementsInstanced', 'drawElementsInstancedANGLE');
        this.createVertexArray = gl.renderer.getExtension('OES_vertex_array_object', 'createVertexArray', 'createVertexArrayOES');
        this.bindVertexArray = gl.renderer.getExtension('OES_vertex_array_object', 'bindVertexArray', 'bindVertexArrayOES');
        this.deleteVertexArray = gl.renderer.getExtension('OES_vertex_array_object', 'deleteVertexArray', 'deleteVertexArrayOES');

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

        // Push data to buffer
        this.updateAttribute(attr);

        // Update geometry counts. If indexed, ignore regular attributes
        if (attr.instanced) {
            if (this.instancedCount && this.instancedCount !== attr.count) {
                console.warn('geometry has multiple instanced buffers of different length');
                return this.instancedCount = Math.min(this.instancedCount, attr.count);
            }
            this.instancedCount = attr.count;
            this.isInstanced = true;
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

    draw({
        program,
        mode = this.gl.TRIANGLES,
        geometryBound = false,
    }) {

        // Create VAO on first draw. Needs to wait for program to get attribute locations
        if (!this.vao) {
            this.vao = this.createVertexArray();
            this.bindVertexArray(this.vao);

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

                // For instanced attributes
                if (attr.instanced) {

                    // attribute used once per instance
                    this.vertexAttribDivisor(location, 1);
                } else {

                    // TODO: find a smarter way than calling this on everything ?
                    // For firefox, need to set back to 0 if non-instanced drawn after instanced. Else won't render
                    this.vertexAttribDivisor(location, 0);
                }
            });

            // Bind indices if geometry indexed
            if (this.attributes.index) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);

            // Store so doesn't bind redundantly
            this.gl.renderer.currentGeometry = this.id;

        } else if (!geometryBound) {

            // Bind if not already bound to program
            this.bindVertexArray(this.vao);

            // Store so doesn't bind redundantly
            this.gl.renderer.currentGeometry = this.id;
        }

        if (this.isInstanced) {
            if (this.attributes.index) {
                this.drawElementsInstanced(mode, this.drawRange.count, this.attributes.index.type, this.drawRange.start, this.instancedCount);
            } else {
                this.drawArraysInstanced(mode, this.drawRange.start, this.drawRange.count, this.instancedCount);
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
        if (this.vao) this.deleteVertexArray(this.vao);
        for (let key in this.attributes) {
            this.gl.deleteBuffer(this.attributes[key].buffer);
            delete this.attributes[key];

        }
    }
}