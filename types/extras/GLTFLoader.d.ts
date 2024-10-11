import { Geometry } from '../core/Geometry.js';
import { Transform } from '../core/Transform.js';
import { Texture } from '../core/Texture.js';
import { Mesh } from '../core/Mesh.js';
import { GLTFAnimation } from './GLTFAnimation.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { NormalProgram } from './NormalProgram.js';
import { InstancedMesh } from './InstancedMesh.js';

import type { OGLRenderingContext } from '../core/Renderer.js';
import type { Camera } from '../core/Camera.js';
import type { Color } from '../math/Color.js';
import type { BasisManager } from './BasisManager.js';
import type { GLTFSkinSkeleton } from './GLTFSkin.js';

export interface GLTFAnimationReference {
    name: string;
    animation: GLTFAnimation;
}

export interface GLTFLightOptions {
    name: string;
    color: { value: Color };
    direction: { value: Vec3 };
    position: { value: Vec3 };
    distance: { value: number };
    decay: { value: number };
}

export interface GLTFLights {
    directional: Partial<GLTFLightOptions>[];
    point: Partial<GLTFLightOptions>[];
    spot: Partial<GLTFLightOptions>[];
}

export interface GLTFAccessor {
    data: ArrayLike<number>;
    size: number;
    type: number | string;
    normalized: boolean;
    buffer: WebGLBuffer;
    stride: number;
    offset: number;
    count: number;
    min: number;
    max: number;
}

export interface GLTFSkinReference {
    inverseBindMatrices: GLTFAccessor;
    skeleton: GLTFSkinSkeleton;
    joints: { worldMatrix: Mat4; bindInverse: Mat4 }[];
}

export interface GLTFMaterial {
    name: string;
    extensions: object;
    extras: object;
    baseColorFactor: [number, number, number, number];
    baseColorTexture: { texture: Texture; scale: number };
    metallicFactor: number;
    roughnessFactor: number;
    metallicRoughnessTexture: { texture: Texture; scale: number };
    normalTexture: { texture: Texture; scale: number };
    occlusionTexture: { texture: Texture; scale: number };
    emissiveTexture: { texture: Texture; scale: number };
    emissiveFactor: [number, number, number];
    alphaMode: string;
    alphaCutoff: number;
    doubleSided: boolean;
}

export interface GLTFProgram extends NormalProgram {
    gltfMaterial: GLTFMaterial;
}

export interface GLTFPrimitive {
    geometry: Geometry;
    program: GLTFProgram;
    mode: number;
}

export interface GLTFMesh {
    primitives: (InstancedMesh | Mesh)[];
    weights: number[];
    name: string;
}

export interface GLTFDescription {} // TODO: remove?

export interface GLTF {
    json: GLTFDescription;
    buffers: ArrayBuffer[];
    bufferViews: ArrayBufferView[];
    images: (HTMLImageElement | ImageBitmap)[];
    textures: Texture[];
    materials: GLTFMaterial[];
    meshes: GLTFMesh[];
    nodes: (InstancedMesh | Mesh)[];
    lights: GLTFLights;
    animations: GLTFAnimationReference[];
    scenes: Transform[][];
    scene: Transform[];
}

/**
 * The {@link https://www.khronos.org/gltf/ | glTF (GL Transmission Format)} loader.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/GLTFLoader.js | Source}
 */
export class GLTFLoader {
    static setBasisManager(manager: BasisManager): void;

    static load(gl: OGLRenderingContext, src: string): Promise<GLTF>;

    static parse(gl: OGLRenderingContext, desc: GLTFDescription, dir: string): Promise<GLTF>;

    static parseDesc(src: string): Promise<GLTFDescription>;

    static unpackGLB(glb: ArrayBuffer): GLTFDescription;

    static resolveURI(uri: string, dir: string): string;

    static loadBuffers(desc: GLTFDescription, dir: string): Promise<ArrayBuffer[]> | null;

    static parseBufferViews(gl: OGLRenderingContext, desc: GLTFDescription, buffers: ArrayBuffer[]): ArrayBufferView[] | null;

    static parseImages(
        gl: OGLRenderingContext,
        desc: GLTFDescription,
        dir: string,
        bufferViews: ArrayBufferView[],
    ): Promise<(HTMLImageElement | ImageBitmap)[]> | null;

    static parseTextures(gl: OGLRenderingContext, desc: GLTFDescription, images: (HTMLImageElement | ImageBitmap)[]): Texture[] | null;

    static createTexture(
        gl: OGLRenderingContext,
        desc: GLTFDescription,
        images: (HTMLImageElement | ImageBitmap)[],
        options: { sample: number; source: number; name: string; extensions: object; extras: object },
    ): Texture;

    static parseMaterials(gl: OGLRenderingContext, desc: GLTFDescription, textures: Texture[]): GLTFMaterial[] | null;

    static parseSkins(gl: OGLRenderingContext, desc: GLTFDescription, bufferViews: ArrayBufferView[]): GLTFSkinReference[] | null;

    static parseMeshes(
        gl: OGLRenderingContext,
        desc: GLTFDescription,
        bufferViews: ArrayBufferView[],
        materials: GLTFMaterial[],
        skins: GLTFSkinReference[],
    ): GLTFMesh[] | null;

    static parsePrimitives(
        gl: OGLRenderingContext,
        primitives: object[],
        desc: GLTFDescription,
        bufferViews: ArrayBufferView[],
        materials: GLTFMaterial[],
        numInstances: number,
        isLightmap: boolean,
    ): GLTFPrimitive[];

    static parseAccessor(index: number, desc: GLTFDescription, bufferViews: ArrayBufferView[]): GLTFAccessor;

    static parseNodes(
        gl: OGLRenderingContext,
        desc: GLTFDescription,
        meshes: GLTFMesh[],
        skins: GLTFSkinReference[],
        images: (HTMLImageElement | ImageBitmap)[],
    ): [(InstancedMesh | Mesh)[], (Camera | Transform)[]] | null;

    static populateSkins(skins: GLTFSkinReference[], nodes: (InstancedMesh | Mesh)[]): void;

    static parseAnimations(
        gl: OGLRenderingContext,
        desc: GLTFDescription,
        nodes: (InstancedMesh | Mesh)[],
        bufferViews: ArrayBufferView[],
    ): GLTFAnimationReference[] | null;

    static parseScenes(desc: GLTFDescription, nodes: (InstancedMesh | Mesh)[]): Transform[] | null;

    static parseLights(gl: OGLRenderingContext, desc: GLTFDescription, nodes: (InstancedMesh | Mesh)[], scenes: Transform[]): GLTFLights;
}
