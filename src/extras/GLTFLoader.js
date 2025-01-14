import { Geometry } from '../core/Geometry.js';
import { Transform } from '../core/Transform.js';
import { Texture } from '../core/Texture.js';
import { Mesh } from '../core/Mesh.js';
import { Camera } from '../core/Camera.js';
import { GLTFAnimation } from './GLTFAnimation.js';
import { GLTFSkin } from './GLTFSkin.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { NormalProgram } from './NormalProgram.js';
import { InstancedMesh } from './InstancedMesh.js';

// TODO
// [ ] Morph targets
// [ ] Materials
// [ ] Sparse accessor packing? For morph targets basically
// [ ] Option to turn off GPU instancing?
// [ ] Spot lights

const TYPE_ARRAY = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
    'image/jpeg': Uint8Array,
    'image/png': Uint8Array,
    'image/webp': Uint8Array,
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
    static setDracoManager(manager) {
        this.dracoManager = manager;
    }

    static setBasisManager(manager) {
        this.basisManager = manager;
    }

    static async load(gl, src) {
        const dir = src.split('/').slice(0, -1).join('/') + '/';

        // Load main description json
        const desc = await this.parseDesc(src);

        return this.parse(gl, desc, dir);
    }

    static async parse(gl, desc, dir) {
        if (desc.asset === undefined || desc.asset.version[0] < 2)
            console.warn('Only GLTF >=2.0 supported. Attempting to parse.');

        if (desc.extensionsRequired?.includes('KHR_draco_mesh_compression') && !this.dracoManager)
            console.warn('KHR_draco_mesh_compression extension required but no manager supplied. Use .setDracoManager()');

        if (desc.extensionsRequired?.includes('KHR_texture_basisu') && !this.basisManager)
            console.warn('KHR_texture_basisu extension required but no manager supplied. Use .setBasisManager()');

        // Load buffers async
        const buffers = await this.loadBuffers(desc, dir);

        // Unbind current VAO so that new buffers don't get added to active mesh
        gl.renderer.bindVertexArray(null);

        // Create gl buffers from bufferViews
        const bufferViews = this.parseBufferViews(gl, desc, buffers);

        // Create images from either bufferViews or separate image files
        const images = await this.parseImages(gl, desc, dir, bufferViews);

        const textures = this.parseTextures(gl, desc, images);

        // Just pass through material data for now
        const materials = this.parseMaterials(gl, desc, textures);

        // Fetch the inverse bind matrices for skeleton joints
        const skins = this.parseSkins(gl, desc, bufferViews);

        // Create geometries for each mesh primitive
        const meshes = await this.parseMeshes(gl, desc, bufferViews, materials, skins);

        // Create transforms, meshes and hierarchy
        const [nodes, cameras] = this.parseNodes(gl, desc, meshes, skins, images);

        // Place nodes in skeletons
        this.populateSkins(skins, nodes);

        // Create animation handlers
        const animations = this.parseAnimations(gl, desc, nodes, bufferViews);

        // Get top level nodes for each scene
        const scenes = this.parseScenes(desc, nodes);
        const scene = scenes[desc.scene];

        // Create uniforms for scene lights (TODO: light linking?)
        const lights = this.parseLights(gl, desc, nodes, scenes);

        // Remove null nodes (instanced transforms)
        for (let i = nodes.length; i >= 0; i--) if (!nodes[i]) nodes.splice(i, 1);

        return {
            json: desc,
            buffers,
            bufferViews,
            cameras,
            images,
            textures,
            materials,
            meshes,
            nodes,
            lights,
            animations,
            scenes,
            scene,
        };
    }

    static parseDesc(src) {
        return fetch(src, { mode: 'cors' })
            .then((res) => res.arrayBuffer())
            .then((data) => {
                const textDecoder = new TextDecoder();
                if (textDecoder.decode(new Uint8Array(data, 0, 4)) === 'glTF') {
                    return this.unpackGLB(data);
                } else {
                    return JSON.parse(textDecoder.decode(data));
                }
            });
    }

    // From https://github.com/donmccurdy/glTF-Transform/blob/e4108cc/packages/core/src/io/io.ts#L32
    static unpackGLB(glb) {
        // Decode and verify GLB header
        const header = new Uint32Array(glb, 0, 3);
        if (header[0] !== 0x46546c67) {
            throw new Error('Invalid glTF asset.');
        } else if (header[1] !== 2) {
            throw new Error(`Unsupported glTF binary version, "${header[1]}".`);
        }
        // Decode and verify chunk headers
        const jsonChunkHeader = new Uint32Array(glb, 12, 2);
        const jsonByteOffset = 20;
        const jsonByteLength = jsonChunkHeader[0];
        if (jsonChunkHeader[1] !== 0x4e4f534a) {
            throw new Error('Unexpected GLB layout.');
        }

        // Decode JSON
        const jsonText = new TextDecoder().decode(glb.slice(jsonByteOffset, jsonByteOffset + jsonByteLength));
        const json = JSON.parse(jsonText);
        // JSON only
        if (jsonByteOffset + jsonByteLength === glb.byteLength) return json;

        const binaryChunkHeader = new Uint32Array(glb, jsonByteOffset + jsonByteLength, 2);
        if (binaryChunkHeader[1] !== 0x004e4942) {
            throw new Error('Unexpected GLB layout.');
        }
        // Decode content
        const binaryByteOffset = jsonByteOffset + jsonByteLength + 8;
        const binaryByteLength = binaryChunkHeader[0];
        const binary = glb.slice(binaryByteOffset, binaryByteOffset + binaryByteLength);
        // Attach binary to buffer
        json.buffers[0].binary = binary;
        return json;
    }

    // ThreeJS GLTF Loader https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js#L1085
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

    static loadBuffers(desc, dir) {
        if (!desc.buffers) return null;
        return Promise.all(
            desc.buffers.map((buffer) => {
                // For GLB, binary buffer ready to go
                if (buffer.binary) return buffer.binary;
                const uri = this.resolveURI(buffer.uri, dir);
                return fetch(uri, { mode: 'cors' }).then((res) => res.arrayBuffer());
            })
        );
    }

    static parseBufferViews(gl, desc, buffers) {
        if (!desc.bufferViews) return null;
        const bufferViews = desc.bufferViews;

        desc.meshes &&
            desc.meshes.forEach(({ primitives }) => {
                primitives.forEach(({ attributes, indices, extensions }) => {
                    // Flag bufferView as an attribute, so it knows to create a gl buffer
                    for (const attr in attributes) {
                        const accessor = desc.accessors[attributes[attr]];
                        if (accessor.bufferView === undefined && !!extensions) {
                            // Draco extension buffer view
                            if (extensions.KHR_draco_mesh_compression) {
                                accessor.bufferView = extensions.KHR_draco_mesh_compression.bufferView;
                                bufferViews[accessor.bufferView].isDraco = true;
                            }
                        }
                        bufferViews[accessor.bufferView].isAttribute = true;
                    }

                    if (indices !== undefined) {
                        const accessor = desc.accessors[indices];
                        if (accessor.bufferView === undefined && !!extensions) {
                            // Draco extension buffer view
                            if (extensions.KHR_draco_mesh_compression) {
                                accessor.bufferView = extensions.KHR_draco_mesh_compression.bufferView;
                                bufferViews[accessor.bufferView].isDraco = true;
                            }
                        }
                        bufferViews[accessor.bufferView].isAttribute = true;

                        // Make sure indices bufferView have a target property for gl buffer binding
                        bufferViews[accessor.bufferView].target = gl.ELEMENT_ARRAY_BUFFER;
                    }
                });
            });

        // Get componentType of each bufferView from the accessors
        desc.accessors.forEach(({ bufferView: bufferViewIndex, componentType }) => {
            if (bufferViewIndex === undefined) return;
            bufferViews[bufferViewIndex].componentType = componentType;
        });

        // Get mimetype of bufferView from images
        desc.images &&
            desc.images.forEach(({ uri, bufferView: bufferViewIndex, mimeType }) => {
                if (bufferViewIndex === undefined) return;
                bufferViews[bufferViewIndex].mimeType = mimeType;
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

                    componentType, // optional, added from accessor above
                    mimeType, // optional, added from images above
                    isAttribute,
                    isDraco,
                },
                i
            ) => {
                bufferViews[i].data = buffers[bufferIndex].slice(byteOffset, byteOffset + byteLength);

                if (!isAttribute || isDraco) return;
                // Create gl buffers for the bufferView, pushing it to the GPU
                const buffer = gl.createBuffer();
                gl.bindBuffer(target, buffer);
                gl.renderer.state.boundBuffer = buffer;
                gl.bufferData(target, bufferViews[i].data, gl.STATIC_DRAW);
                bufferViews[i].buffer = buffer;
            }
        );

        return bufferViews;
    }

    static parseImages(gl, desc, dir, bufferViews) {
        if (!desc.images) return null;
        return Promise.all(
            desc.images.map(async ({ uri, bufferView: bufferViewIndex, mimeType, name }) => {
                if (mimeType === 'image/ktx2') {
                    const { data } = bufferViews[bufferViewIndex];
                    const image = await this.basisManager.parseTexture(data);
                    return image;
                }

                // jpg / png / webp
                const image = new Image();
                image.name = name;
                if (uri) {
                    image.src = this.resolveURI(uri, dir);
                } else if (bufferViewIndex !== undefined) {
                    const { data } = bufferViews[bufferViewIndex];
                    const blob = new Blob([data], { type: mimeType });
                    image.src = URL.createObjectURL(blob);
                }
                image.ready = new Promise((res) => {
                    image.onload = () => res();
                });
                return image;
            })
        );
    }

    static parseTextures(gl, desc, images) {
        if (!desc.textures) return null;
        return desc.textures.map((textureInfo) => this.createTexture(gl, desc, images, textureInfo));
    }

    static createTexture(gl, desc, images, { sampler: samplerIndex, source: sourceIndex, name, extensions, extras }) {
        if (sourceIndex === undefined && !!extensions) {
            // WebP extension source index
            if (extensions.EXT_texture_webp) sourceIndex = extensions.EXT_texture_webp.source;

            // Basis extension source index
            if (extensions.KHR_texture_basisu) sourceIndex = extensions.KHR_texture_basisu.source;
        }

        const image = images[sourceIndex];
        if (image.texture) return image.texture;

        const options = {
            flipY: false,
            wrapS: gl.REPEAT, // Repeat by default, opposed to OGL's clamp by default
            wrapT: gl.REPEAT,
        };
        const sampler = samplerIndex !== undefined ? desc.samplers[samplerIndex] : null;
        if (sampler) {
            ['magFilter', 'minFilter', 'wrapS', 'wrapT'].forEach((prop) => {
                if (sampler[prop]) options[prop] = sampler[prop];
            });
        }

        // For compressed textures
        if (image.isBasis) {
            options.image = image;
            options.internalFormat = image.internalFormat;
            if (image.isCompressedTexture) {
                options.generateMipmaps = false;
                if (image.length > 1) this.minFilter = gl.NEAREST_MIPMAP_LINEAR;
            }
            const texture = new Texture(gl, options);
            texture.name = name;
            image.texture = texture;
            return texture;
        }

        const texture = new Texture(gl, options);
        texture.name = name;
        image.texture = texture;
        image.ready.then(() => {
            texture.image = image;
        });

        return texture;
    }

    static parseMaterials(gl, desc, textures) {
        if (!desc.materials) return null;
        return desc.materials.map(
            ({
                name,
                extensions,
                extras,
                pbrMetallicRoughness = {},
                normalTexture,
                occlusionTexture,
                emissiveTexture,
                emissiveFactor = [0, 0, 0],
                alphaMode = 'OPAQUE',
                alphaCutoff = 0.5,
                doubleSided = false,
            }) => {
                const {
                    baseColorFactor = [1, 1, 1, 1],
                    baseColorTexture,
                    metallicFactor = 1,
                    roughnessFactor = 1,
                    metallicRoughnessTexture,
                    //   extensions,
                    //   extras,
                } = pbrMetallicRoughness;

                if (baseColorTexture) {
                    baseColorTexture.texture = textures[baseColorTexture.index];
                    // texCoord
                }
                if (normalTexture) {
                    normalTexture.texture = textures[normalTexture.index];
                    // scale: 1
                    // texCoord
                }
                if (metallicRoughnessTexture) {
                    metallicRoughnessTexture.texture = textures[metallicRoughnessTexture.index];
                    // texCoord
                }
                if (occlusionTexture) {
                    occlusionTexture.texture = textures[occlusionTexture.index];
                    // strength 1
                    // texCoord
                }
                if (emissiveTexture) {
                    emissiveTexture.texture = textures[emissiveTexture.index];
                    // texCoord
                }

                return {
                    name,
                    extensions,
                    extras,
                    baseColorFactor,
                    baseColorTexture,
                    metallicFactor,
                    roughnessFactor,
                    metallicRoughnessTexture,
                    normalTexture,
                    occlusionTexture,
                    emissiveTexture,
                    emissiveFactor,
                    alphaMode,
                    alphaCutoff,
                    doubleSided,
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

    static parseMeshes(gl, desc, bufferViews, materials, skins) {
        if (!desc.meshes) return null;
        return Promise.all(
            desc.meshes.map(
                async (
                    {
                        primitives, // required
                        weights, // optional
                        name, // optional
                        extensions, // optional
                        extras = {}, // optional - will get merged with node extras
                    },
                    meshIndex
                ) => {
                    // TODO: weights stuff?
                    // Parse through nodes to see how many instances there are and if there is a skin attached
                    // If multiple instances of a skin, need to create each
                    let numInstances = 0;
                    let skinIndices = [];
                    let isLightmap = false;
                    desc.nodes &&
                        desc.nodes.forEach(({ mesh, skin, extras }) => {
                            if (mesh === meshIndex) {
                                numInstances++;
                                if (skin !== undefined) skinIndices.push(skin);
                                if (extras && extras.lightmap_scale_offset) isLightmap = true;
                            }
                        });
                    let isSkin = !!skinIndices.length;

                    // For skins, return array of skin meshes to account for multiple instances
                    if (isSkin) {
                        primitives = await Promise.all(
                            skinIndices.map(async (skinIndex) => {
                                return (await this.parsePrimitives(gl, primitives, desc, bufferViews, materials, 1, isLightmap)).map(({ geometry, program, mode }) => {
                                    const mesh = new GLTFSkin(gl, { skeleton: skins[skinIndex], geometry, program, mode });
                                    mesh.name = name;
                                    mesh.extras = extras;
                                    if (extensions) mesh.extensions = extensions;
                                    // TODO: support skin frustum culling
                                    mesh.frustumCulled = false;
                                    return mesh;
                                });
                            })
                        );
                        // For retrieval to add to node
                        primitives.instanceCount = 0;
                        primitives.numInstances = numInstances;
                    } else {
                        primitives = (await this.parsePrimitives(gl, primitives, desc, bufferViews, materials, numInstances, isLightmap)).map(({ geometry, program, mode }) => {
                            // InstancedMesh class has custom frustum culling for instances
                            const meshConstructor = geometry.attributes.instanceMatrix ? InstancedMesh : Mesh;
                            const mesh = new meshConstructor(gl, { geometry, program, mode });
                            mesh.name = name;
                            mesh.extras = extras;
                            if (extensions) mesh.extensions = extensions;
                            // Tag mesh so that nodes can add their transforms to the instance attribute
                            mesh.numInstances = numInstances;
                            return mesh;
                        });
                    }

                    return {
                        primitives,
                        weights,
                        name,
                    };
                }
            )
        );
    }

    static parsePrimitives(gl, primitives, desc, bufferViews, materials, numInstances, isLightmap) {
        return Promise.all(
            primitives.map(
                async ({
                    attributes, // required
                    indices, // optional
                    material: materialIndex, // optional
                    mode = 4, // optional
                    targets, // optional
                    extensions, // optional
                    extras, // optional
                }) => {
                    // TODO: materials
                    const program = new NormalProgram(gl);
                    if (materialIndex !== undefined) {
                        program.gltfMaterial = materials[materialIndex];
                    }

                    const geometry = new Geometry(gl);
                    if (extras) geometry.extras = extras;
                    if (extensions) geometry.extensions = extensions;

                    // For compressed geometry data
                    if (extensions && extensions.KHR_draco_mesh_compression) {
                        const bufferViewIndex = extensions.KHR_draco_mesh_compression.bufferView;
                        const gltfAttributeMap = extensions.KHR_draco_mesh_compression.attributes;
                        const attributeMap = {};
                        const attributeTypeMap = {};
                        const attributeTypeNameMap = {};
                        const attributeNormalizedMap = {};

                        for (const attr in attributes) {
                            const accessor = desc.accessors[attributes[attr]];
                            const attributeName = ATTRIBUTES[attr];
                            attributeMap[attributeName] = gltfAttributeMap[attr];
                            attributeTypeMap[attributeName] = accessor.componentType;
                            attributeTypeNameMap[attributeName] = TYPE_ARRAY[accessor.componentType].name;
                            attributeNormalizedMap[attributeName] = accessor.normalized === true;
                        }

                        const { data } = bufferViews[bufferViewIndex];
                        const geometryData = await this.dracoManager.decodeGeometry(data, {
                            attributeIds: attributeMap,
                            attributeTypes: attributeTypeNameMap,
                        });

                        // Add each attribute result
                        for (let i = 0; i < geometryData.attributes.length; i++) {
                            const result = geometryData.attributes[i];
                            const name = result.name;
                            const data = result.array;
                            const size = result.itemSize;
                            const type = attributeTypeMap[name];
                            const normalized = attributeNormalizedMap[name];

                            // Create gl buffers for the attribute data, pushing it to the GPU
                            const buffer = gl.createBuffer();
                            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                            gl.renderer.state.boundBuffer = buffer;
                            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

                            geometry.addAttribute(name, {
                                data,
                                size,
                                type,
                                normalized,
                                buffer,
                            });
                        }

                        // Add index attribute if found
                        if (geometryData.index) {
                            const data = geometryData.index.array;
                            const size = geometryData.index.itemSize;

                            // Create gl buffers for the index attribute data, pushing it to the GPU
                            const buffer = gl.createBuffer();
                            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                            gl.renderer.state.boundBuffer = buffer;
                            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

                            geometry.addAttribute('index', {
                                data,
                                size,
                                type: 5125, // Uint32Array
                                normalized: false,
                                buffer,
                            });
                        }
                    } else {
                        // Add each attribute found in primitive
                        for (const attr in attributes) {
                            geometry.addAttribute(ATTRIBUTES[attr], this.parseAccessor(attributes[attr], desc, bufferViews));
                        }

                        // Add index attribute if found
                        if (indices !== undefined) {
                            geometry.addAttribute('index', this.parseAccessor(indices, desc, bufferViews));
                        }
                    }

                    // Add instanced transform attribute if multiple instances
                    // Ignore if skin as we don't support instanced skins out of the box
                    if (numInstances > 1) {
                        geometry.addAttribute('instanceMatrix', {
                            instanced: 1,
                            size: 16,
                            data: new Float32Array(numInstances * 16),
                        });
                    }

                    // Always supply lightmapScaleOffset as an instanced attribute
                    // Instanced skin lightmaps not supported
                    if (isLightmap) {
                        geometry.addAttribute('lightmapScaleOffset', {
                            instanced: 1,
                            size: 4,
                            data: new Float32Array(numInstances * 4),
                        });
                    }

                    return {
                        geometry,
                        program,
                        mode,
                    };
                }
            )
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
            byteOffset: bufferByteOffset = 0,
            // byteLength, // applied in parseBufferViews
            byteStride = 0,
            target,
            // name,
            // extensions,
            // extras,
        } = bufferViews[bufferViewIndex];

        const size = TYPE_SIZE[type];

        // Parse data from joined buffers
        const TypeArray = TYPE_ARRAY[componentType];
        const elementBytes = TypeArray.BYTES_PER_ELEMENT;
        const componentStride = byteStride / elementBytes;
        const isInterleaved = !!byteStride && componentStride !== size;

        let filteredData;

        // Convert data to typed array for various uses (bounding boxes, raycasting, animation, merging etc)
        if (isInterleaved) {
            // First convert entire buffer to type
            const typedData = new TypeArray(data, byteOffset);
            // TODO: add length to not copy entire buffer if can help it
            // const typedData = new TypeArray(data, byteOffset, (count - 1) * componentStride)

            // Create output with length
            filteredData = new TypeArray(count * size);

            // Add element by element
            for (let i = 0; i < count; i++) {
                const start = componentStride * i;
                const end = start + size;
                filteredData.set(typedData.slice(start, end), i * size);
            }
        } else {
            // Simply a slice
            filteredData = new TypeArray(data, byteOffset, count * size);
        }

        // Return attribute data
        return {
            data: filteredData,
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

    static parseNodes(gl, desc, meshes, skins, images) {
        if (!desc.nodes) return null;
        const cameras = [];
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
                const isCamera = camera !== undefined;

                const node = isCamera ? new Camera(gl) : new Transform();

                if (isCamera) {
                    // NOTE: chose to use node's name and extras/extensions over camera
                    const cameraOpts = desc.cameras[camera];
                    if (cameraOpts.type === 'perspective') {
                        const { yfov: fov, znear: near, zfar: far } = cameraOpts.perspective;
                        node.perspective({ fov: fov * (180 / Math.PI), near, far });
                    } else {
                        const { xmag, ymag, znear: near, zfar: far } = cameraOpts.orthographic;
                        node.orthographic({ near, far, left: -xmag, right: xmag, top: -ymag, bottom: ymag });
                    }
                    cameras.push(node);
                }

                if (name) node.name = name;
                if (extras) node.extras = extras;
                if (extensions) node.extensions = extensions;

                // Need to attach to node as may have same material but different lightmap
                if (extras && extras.lightmapTexture !== undefined) {
                    extras.lightmapTexture.texture = this.createTexture(gl, desc, images, { source: extras.lightmapTexture.index });
                }

                // Apply transformations
                if (matrix) {
                    node.matrix.copy(matrix);
                    node.decompose();
                } else {
                    if (rotation) node.quaternion.copy(rotation);
                    if (scale) node.scale.copy(scale);
                    if (translation) node.position.copy(translation);
                    node.updateMatrix();
                }

                // Flags for avoiding duplicate transforms and removing unused instance nodes
                let isInstanced = false;
                let isFirstInstance = true;
                let isInstancedMatrix = false;
                let isSkin = skinIndex !== undefined;

                // Add mesh if included
                if (meshIndex !== undefined) {
                    if (isSkin) {
                        meshes[meshIndex].primitives[meshes[meshIndex].primitives.instanceCount].forEach((mesh) => {
                            if (extras) Object.assign(mesh.extras, extras);
                            mesh.setParent(node);
                        });
                        meshes[meshIndex].primitives.instanceCount++;
                        // Remove properties once all instances added
                        if (meshes[meshIndex].primitives.instanceCount === meshes[meshIndex].primitives.numInstances) {
                            delete meshes[meshIndex].primitives.numInstances;
                            delete meshes[meshIndex].primitives.instanceCount;
                        }
                    } else {
                        meshes[meshIndex].primitives.forEach((mesh) => {
                            if (extras) Object.assign(mesh.extras, extras);

                            // Instanced mesh might only have 1
                            if (mesh.geometry.isInstanced) {
                                isInstanced = true;
                                if (!mesh.instanceCount) {
                                    mesh.instanceCount = 0;
                                } else {
                                    isFirstInstance = false;
                                }
                                if (mesh.geometry.attributes.instanceMatrix) {
                                    isInstancedMatrix = true;
                                    node.matrix.toArray(mesh.geometry.attributes.instanceMatrix.data, mesh.instanceCount * 16);
                                }

                                if (mesh.geometry.attributes.lightmapScaleOffset) {
                                    mesh.geometry.attributes.lightmapScaleOffset.data.set(extras.lightmap_scale_offset, mesh.instanceCount * 4);
                                }

                                mesh.instanceCount++;

                                if (mesh.instanceCount === mesh.numInstances) {
                                    // Remove properties once all instances added
                                    delete mesh.numInstances;
                                    delete mesh.instanceCount;
                                    // Flag attribute as dirty
                                    if (mesh.geometry.attributes.instanceMatrix) {
                                        mesh.geometry.attributes.instanceMatrix.needsUpdate = true;
                                    }
                                    if (mesh.geometry.attributes.lightmapScaleOffset) {
                                        mesh.geometry.attributes.lightmapScaleOffset.needsUpdate = true;
                                    }
                                }
                            }

                            // For instances, only the first node will actually have the mesh
                            if (isInstanced) {
                                if (isFirstInstance) mesh.setParent(node);
                            } else {
                                mesh.setParent(node);
                            }
                        });
                    }
                }

                // Reset node if instanced to not duplicate transforms
                if (isInstancedMatrix) {
                    // Remove unused nodes just providing an instance transform
                    if (!isFirstInstance) return null;
                    // Avoid duplicate transform for node containing the instanced mesh
                    node.matrix.identity();
                    node.decompose();
                }

                return node;
            }
        );

        desc.nodes.forEach(({ children = [] }, i) => {
            // Set hierarchy now all nodes created
            children.forEach((childIndex) => {
                if (!nodes[childIndex]) return;
                nodes[childIndex].setParent(nodes[i]);
            });
        });

        // Add frustum culling for instances now that instanceMatrix attribute is populated
        meshes.forEach(({ primitives }, i) => {
            primitives.forEach((primitive, i) => {
                if (primitive.isInstancedMesh) primitive.addFrustumCull();
            });
        });

        return [nodes, cameras];
    }

    static populateSkins(skins, nodes) {
        if (!skins) return;
        skins.forEach((skin) => {
            skin.joints = skin.joints.map((i, index) => {
                const joint = nodes[i];
                joint.skin = skin;
                joint.bindInverse = new Mat4(...skin.inverseBindMatrices.data.slice(index * 16, (index + 1) * 16));
                return joint;
            });
            if (skin.skeleton) skin.skeleton = nodes[skin.skeleton];
        });
    }

    static parseAnimations(gl, desc, nodes, bufferViews) {
        if (!desc.animations) return null;
        return desc.animations.map(
            (
                {
                    channels, // required
                    samplers, // required
                    name, // optional
                    // extensions, // optional
                    // extras,  // optional
                },
                animationIndex
            ) => {
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
                        const times = this.parseAccessor(inputIndex, desc, bufferViews).data;
                        const values = this.parseAccessor(outputIndex, desc, bufferViews).data;

                        // Store reference on node for cyclical retrieval
                        if (!node.animations) node.animations = [];
                        if (!node.animations.includes(animationIndex)) node.animations.push(animationIndex);

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
        if (!desc.scenes) return null;
        return desc.scenes.map(
            ({
                nodes: nodesIndices = [],
                name, // optional
                extensions,
                extras,
            }) => {
                const scene = nodesIndices.reduce((map, i) => {
                    // Don't add null nodes (instanced transforms)
                    if (nodes[i]) map.push(nodes[i]);
                    return map;
                }, []);
                scene.extras = extras;
                return scene;
            }
        );
    }

    static parseLights(gl, desc, nodes, scenes) {
        const lights = {
            directional: [],
            point: [],
            spot: [],
        };

        // Update matrices on root nodes
        scenes.forEach((scene) => scene.forEach((node) => node.updateMatrixWorld()));

        // Uses KHR_lights_punctual extension
        const lightsDescArray = desc.extensions?.KHR_lights_punctual?.lights || [];

        // Need nodes for transforms
        nodes.forEach((node) => {
            if (!node?.extensions?.KHR_lights_punctual) return;
            const lightIndex = node.extensions.KHR_lights_punctual.light;
            const lightDesc = lightsDescArray[lightIndex];
            const light = {
                name: lightDesc.name || '',
                color: { value: new Vec3().set(lightDesc.color || 1) },
            };
            // Apply intensity directly to color
            if (lightDesc.intensity !== undefined) light.color.value.multiply(lightDesc.intensity);

            switch (lightDesc.type) {
                case 'directional':
                    light.direction = { value: new Vec3(0, 0, 1).transformDirection(node.worldMatrix) };
                    break;
                case 'point':
                    light.position = { value: new Vec3().applyMatrix4(node.worldMatrix) };
                    light.distance = { value: lightDesc.range };
                    light.decay = { value: 2 };
                    break;
                case 'spot':
                    // TODO: support spot uniforms
                    Object.assign(light, lightDesc);
                    break;
            }

            lights[lightDesc.type].push(light);
        });

        return lights;
    }
}
