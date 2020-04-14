import { Geometry } from '../core/Geometry.js';
import { Transform } from '../core/Transform.js';
import { Mesh } from '../core/Mesh.js';
import { GLTFAnimation } from './GLTFAnimation.js';
import { GLTFSkin } from './GLTFSkin.js';
import { Mat4 } from '../math/Mat4.js';
import { NormalProgram } from './NormalProgram.js';

// Supports
// [x] Geometry
// [ ] Sparse support
// [x] Nodes and Hierarchy
// [ ] Morph Targets
// [x] Skins
// [ ] Materials
// [ ] Textures
// [x] Animation
// [ ] Cameras
// [ ] Extensions

// TODO: Sparse accessor packing? For morph targets basically
// TODO: init accessor missing bufferView with 0s
// TODO: morph target animations

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

const TRANSFORMS = {
    translation: 'position',
    rotation: 'quaternion',
    scale: 'scale',
};

export class GLTFLoader {
    static async load(gl, src) {
        const dir = src.split('/').slice(0, -1).join('/') + '/';

        // load main description json
        const desc = await fetch(src).then((res) => res.json());

        if (desc.asset === undefined || desc.asset.version[0] < 2) console.warn('Only GLTF >=2.0 supported. Attempting to parse.');

        // Load buffers async
        const buffers = await this.loadBuffers(desc, dir);

        // Create gl buffers from bufferViews
        const bufferViews = this.parseBufferViews(gl, desc, buffers);

        // Create geometries for each mesh primitive
        const meshes = this.parseMeshes(gl, desc, bufferViews);

        // Fetch the inverse bind matrices for skeleton joints
        const skins = this.parseSkins(gl, desc, bufferViews);

        // Create transforms, meshes and hierarchy
        const nodes = this.parseNodes(gl, desc, meshes, skins);

        // Place nodes in skeletons
        this.populateSkins(skins, nodes);

        // Create animation handlers
        const animations = this.parseAnimations(gl, desc, nodes, bufferViews);

        // Get top level nodes for each scene
        const scenes = this.parseScenes(desc, nodes);
        const scene = scenes[desc.scene];

        return {
            json: desc,
            buffers,
            bufferViews,
            meshes,
            nodes,
            animations,
            scenes,
            scene,
        };
    }

    // Threejs GLTF Loader https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js#L1085
    static resolveURI(uri, dir) {
        // Invalid URI
        if (typeof uri !== 'string' || uri === '') return '';

        // Host Relative URI
        if (/^https?:\/\//i.test(dir) && /^\//.test(uri)) {
            dir = dir.replace(/(^https?:\/\/[^\/]+).*/i, '$1');
        }

        // Absolute URI http://, https://, //
        if (/^(https?:)?\/\//i.test(uri)) return uri;

        // Data URI
        if (/^data:.*,.*$/i.test(uri)) return uri;

        // Blob URI
        if (/^blob:.*$/i.test(uri)) return uri;

        // Relative URI
        return dir + uri;
    }

    static async loadBuffers(desc, dir) {
        return await Promise.all(
            desc.buffers.map((buffer) => {
                const uri = this.resolveURI(buffer.uri, dir);
                return fetch(uri).then((res) => res.arrayBuffer());
            })
        );
    }

    static parseBufferViews(gl, desc, buffers) {
        // Clone to leave description pure
        const bufferViews = desc.bufferViews.map((o) => Object.assign({}, o));

        desc.meshes.forEach(({ primitives }) => {
            primitives.forEach(({ attributes, indices }) => {
                // Flag bufferView as an attribute, so it knows to create a gl buffer
                for (let attr in attributes) bufferViews[desc.accessors[attributes[attr]].bufferView].isAttribute = true;

                if (indices === undefined) return;
                bufferViews[desc.accessors[indices].bufferView].isAttribute = true;

                // Make sure indices bufferView have a target property for gl buffer binding
                bufferViews[desc.accessors[indices].bufferView].target = gl.ELEMENT_ARRAY_BUFFER;
            });
        });

        // Get componentType of each bufferView from the accessors
        desc.accessors.forEach(({ bufferView: i, componentType }) => {
            bufferViews[i].componentType = componentType;
        });

        // Push each bufferView to the GPU as a separate buffer
        bufferViews.forEach(
            (
                {
                    buffer: bufferIndex, // required
                    byteOffset = 0, // optional
                    byteLength, // required
                    byteStride, // optional
                    target = gl.ARRAY_BUFFER, // optional, added above for elements
                    name, // optional
                    extensions, // optional
                    extras, // optional

                    componentType, // required, added from accessor above
                    isAttribute,
                },
                i
            ) => {
                const TypeArray = TYPE_ARRAY[componentType];
                const elementBytes = TypeArray.BYTES_PER_ELEMENT;

                const data = new TypeArray(buffers[bufferIndex], byteOffset, byteLength / elementBytes);
                bufferViews[i].data = data;

                // Create gl buffers for the bufferView, pushing it to the GPU
                if (!isAttribute) return;
                const buffer = gl.createBuffer();
                gl.bindBuffer(target, buffer);
                gl.renderer.state.boundBuffer = buffer;
                gl.bufferData(target, data, gl.STATIC_DRAW);
                bufferViews[i].buffer = buffer;
            }
        );

        return bufferViews;
    }

    static parseMeshes(gl, desc, bufferViews) {
        return desc.meshes.map(
            ({
                primitives, // required
                weights, // optional
                name, // optional
                extensions, // optional
                extras, // optional
            }) => {
                return {
                    primitives: this.parsePrimitives(gl, primitives, desc, bufferViews),
                    weights,
                    name,
                };
            }
        );
    }

    static parseSkins(gl, desc, bufferViews) {
        if (!desc.skins) return null;
        return desc.skins.map(
            ({
                inverseBindMatrices, // optional
                skeleton, // optional
                joints, // required
                // name,
                // extensions,
                // extras,
            }) => {
                return {
                    inverseBindMatrices: this.parseAccessor(inverseBindMatrices, desc, bufferViews),
                    skeleton,
                    joints,
                };
            }
        );
    }

    static populateSkins(skins, nodes) {
        if (!skins) return;
        skins.forEach((skin) => {
            skin.joints = skin.joints.map((i, index) => {
                const joint = nodes[i];
                joint.bindInverse = new Mat4(...skin.inverseBindMatrices.data.slice(index * 16, (index + 1) * 16));
                return joint;
            });
            skin.skeleton = nodes[skin.skeleton];
        });
    }

    static parsePrimitives(gl, primitives, desc, bufferViews) {
        return primitives.map(
            ({
                attributes, // required
                indices, // optional
                material, // optional
                mode = 4, // optional
                targets, // optional
                extensions, // optional
                extras, // optional
            }) => {
                const geometry = new Geometry(gl);

                // Add each attribute found in primitive
                for (let attr in attributes) {
                    geometry.addAttribute(ATTRIBUTES[attr], this.parseAccessor(attributes[attr], desc, bufferViews));
                }

                // Add index attribute if found
                if (indices !== undefined) geometry.addAttribute('index', this.parseAccessor(indices, desc, bufferViews));

                // TODO: materials
                const program = new NormalProgram(gl);

                return {
                    geometry,
                    program,
                    mode,
                };
            }
        );
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
            // extensions, // optional
            // extras, // optional
        } = desc.accessors[index];

        const {
            data, // attached in parseBufferViews
            buffer, // replaced to be the actual GL buffer
            // byteOffset = 0, // applied in parseBufferViews
            // byteLength, // applied in parseBufferViews
            byteStride = 0,
            target,
            // name,
            // extensions,
            // extras,
        } = bufferViews[bufferViewIndex];

        const size = TYPE_SIZE[type];

        // Return attribute data
        return {
            data, // Optional. Used for computing bounds if no min/max
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

    static parseNodes(gl, desc, meshes, skins) {
        const nodes = desc.nodes.map(
            ({
                camera, // optional
                children, // optional
                skin: skinIndex, // optional
                matrix, // optional
                mesh: meshIndex, // optional
                rotation, // optional
                scale, // optional
                translation, // optional
                weights, // optional
                name, // optional
                extensions, // optional
                extras, // optional
            }) => {
                const node = new Transform();
                if (name) node.name = name;

                // Apply transformations
                if (matrix) {
                    node.matrix.copy(matrix);
                    node.decompose();
                } else {
                    if (rotation) node.quaternion.copy(rotation);
                    if (scale) node.scale.copy(scale);
                    if (translation) node.position.copy(translation);
                }

                // add mesh if included
                if (meshIndex !== undefined) {
                    meshes[meshIndex].primitives.forEach(({ geometry, program, mode }) => {
                        if (typeof skinIndex === 'number') {
                            const skin = new GLTFSkin(gl, { skeleton: skins[skinIndex], geometry, program, mode });
                            skin.setParent(node);
                        } else {
                            const mesh = new Mesh(gl, { geometry, program, mode });
                            mesh.setParent(node);
                        }
                    });
                }

                return node;
            }
        );

        desc.nodes.forEach(({ children = [] }, i) => {
            // Set hierarchy now all nodes created
            children.forEach((childIndex) => {
                nodes[childIndex].setParent(nodes[i]);
            });
        });

        return nodes;
    }

    static parseAnimations(gl, desc, nodes, bufferViews) {
        if (!desc.animations) return null;
        return desc.animations.map(
            ({
                channels, // required
                samplers, // required
                name, // optional
                // extensions, // optional
                // extras,  // optional
            }) => {
                const data = channels.map(
                    ({
                        sampler: samplerIndex, // required
                        target, // required
                        // extensions, // optional
                        // extras, // optional
                    }) => {
                        const {
                            input: inputIndex, // required
                            interpolation = 'LINEAR',
                            output: outputIndex, // required
                            // extensions, // optional
                            // extras, // optional
                        } = samplers[samplerIndex];

                        const {
                            node: nodeIndex, // optional - TODO: when is it not included?
                            path, // required
                            // extensions, // optional
                            // extras, // optional
                        } = target;

                        const node = nodes[nodeIndex];
                        const transform = TRANSFORMS[path];
                        const timesAcc = this.parseAccessor(inputIndex, desc, bufferViews);
                        const times = timesAcc.data.slice(timesAcc.offset / 4, timesAcc.offset / 4 + timesAcc.count * timesAcc.size);
                        const valuesAcc = this.parseAccessor(outputIndex, desc, bufferViews);
                        const values = valuesAcc.data.slice(valuesAcc.offset / 4, valuesAcc.offset / 4 + valuesAcc.count * valuesAcc.size);

                        return {
                            node,
                            transform,
                            interpolation,
                            times,
                            values,
                        };
                    }
                );

                return {
                    name,
                    animation: new GLTFAnimation(data),
                };
            }
        );
    }

    static parseScenes(desc, nodes) {
        return desc.scenes.map(
            ({
                nodes: nodesIndices = [],
                name, // optional
                extensions,
                extras,
            }) => {
                return nodesIndices.map((i) => nodes[i]);
            }
        );
    }
}
