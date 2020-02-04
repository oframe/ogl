import { Geometry } from '../core/Geometry.js';

// TODO: only push attribute bufferViews to the GPU
// TODO: Sparse accessor packing? what for?
// TODO: init accessor missing bufferView with 0s
// TODO: is there ever more than one component type per buffer view? surely not...
// TODO: extensions: GLB

const TYPE_ARRAY = {
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

const TYPE_SIZE = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

const ATTRIBUTES = {
    POSITION: 'position',
    NORMAL: 'normal',
    TANGENT: 'tangent',
    TEXCOORD_0: 'uv',
    TEXCOORD_1: 'uv2',
    COLOR_0: 'color',
    WEIGHTS_0: 'skinWeight',
    JOINTS_0: 'skinIndex',
};

export class GLTFLoader {
    static async load(gl, src) {
        const dir = src.split('/').slice(0, -1).join('/') + '/';

        // load main description json
        const desc = await fetch(src).then(res => res.json());

        if (desc.asset === undefined || desc.asset.version[0] < 2) 
            console.warn('Only GLTF >=2.0 supported. Attempting to parse.');

        // Load buffers async
        const buffers = await this.loadBuffers(desc, dir);

        // Create gl buffers from bufferViews
        const bufferViews = this.parseBufferViews(gl, desc, buffers);

        // Create geometries for each mesh primitive
        const meshes = this.parseMeshes(gl, desc, bufferViews);

        return {
            json: desc,
            buffers,
            bufferViews,
            meshes,
        };
    }

    // Threejs GLTF Loader https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js
	static resolveURI(uri, dir) {
		// Invalid URI
		if (typeof uri !== 'string' || uri === '') return '';

		// Host Relative URI
		if (/^https?:\/\//i.test(dir) && /^\//.test(uri)) {
			dir = dir.replace( /(^https?:\/\/[^\/]+).*/i, '$1' );
		}

		// Absolute URI http://, https://, //
		if ( /^(https?:)?\/\//i.test(uri)) return uri;

		// Data URI
		if (/^data:.*,.*$/i.test(uri)) return uri;

		// Blob URI
		if (/^blob:.*$/i.test(uri)) return uri;

		// Relative URI
		return dir + uri;
	}

	static async loadBuffers(desc, dir) {
        return await Promise.all(desc.buffers.map(buffer => {
            const uri = this.resolveURI(buffer.uri, dir);
            return fetch(uri).then(res => res.arrayBuffer());
        }));
    }

    static parseBufferViews(gl, desc, buffers) {
        
        // Clone to leave desc pure
        const bufferViews = desc.bufferViews.map(o => Object.assign({}, o));

        // Work out which bufferViews are for indices to determine whether
        // target is gl.ELEMENT_ARRAY_BUFFER or gl.ARRAY_BUFFER;
        desc.meshes.forEach(({primitives}) => {
            primitives.forEach(({indices}) => {
                if (indices === undefined) return;
                bufferViews[desc.accessors[indices].bufferView].target = gl.ELEMENT_ARRAY_BUFFER;
            });
        })
        
        // Get componentType of each bufferView from the accessors
        desc.accessors.forEach(({bufferView: i, componentType}) => {
            bufferViews[i].componentType = componentType;
        });

        // Push each bufferView to the GPU as a separate buffer
        // TODO: only push attribute bufferViews to the GPU
        bufferViews.forEach(({
            buffer: bufferIndex, // required
            byteOffset = 0, // optional
            byteLength, // required
            byteStride, // optional
            target = gl.ARRAY_BUFFER, // optional, added above for elements
            // name, // optional
            // extensions, // optional
            // extras, // optional

            componentType, // required, added from accessor above
        }, i) => {
            const TypeArray = TYPE_ARRAY[componentType];
            const elementBytes = TypeArray.BYTES_PER_ELEMENT;

            // Create gl buffers for the bufferView, pushing it to the GPU
            const data = new TypeArray(buffers[bufferIndex], byteOffset, byteLength / elementBytes);
            const buffer = gl.createBuffer();
            gl.bindBuffer(target, buffer);
            gl.renderer.state.boundBuffer = buffer;
            gl.bufferData(target, data, gl.STATIC_DRAW);

            bufferViews[i].buffer = buffer;
            bufferViews[i].data = data;
        });

        return bufferViews;
    }

	static parseMeshes(gl, desc, bufferViews) {
        return desc.meshes.map(({
            primitives, // required
            weights, // optional
            // name, // optional
            // extensions, // optional
            // extras, // optional
        }) => {
            return primitives.map(({
                attributes, // required
                indices, // optional
                material, // optional
                mode = 4, // optional
                targets, // optional
                // extensions, // optional
                // extras, // optional
            }) => {
                const geometry = new Geometry(gl);

                // Add each attribute found in primitive
                for (const attr in attributes) {
                    geometry.addAttribute(ATTRIBUTES[attr], this.parseAccessor(attributes[attr], desc, bufferViews));
                }
                
                // Add index attribute if found
                if (indices !== undefined) geometry.addAttribute('index', this.parseAccessor(indices, desc, bufferViews));

                return {
                    geometry,
                    mode: mode,
                };
            });
        });

	}

	static parseAccessor(index, desc, bufferViews) {
        // TODO: init missing bufferView with 0s
        // TODO: support sparse

        const {
            bufferView: bufferViewIndex, // optional
            byteOffset = 0, // optional
            componentType, // required
            normalized = false, // optional
            count, // required
            type, // required
            min, // optional
            max, // optional
            sparse, // optional
            // name, // optional
            // extension, // optional
            // extras, // optional
        } = desc.accessors[index];

        const {
            data, // attached in parseBufferViews
            buffer, // replaced to be the actual GL buffer
            byteOffset: bufferViewByteOffset = 0,
            byteLength,
            byteStride = 0,
            target,
            // name,
            // extensions,
            // extras,
        } = bufferViews[bufferViewIndex];

        const size = TYPE_SIZE[type];

        // Return attribute data
        return {
            data, // Optional. Used for computing bounds
            size,
            type: componentType,
            normalized,
            buffer,
            stride: byteStride,
            offset: byteOffset,
            count,
            min,
            max,
        };
	}
}

