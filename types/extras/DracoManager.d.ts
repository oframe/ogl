import type { AttributeData } from '../core/Geometry.js';

export type AttributeIds = Record<string, number>;

export type AttributeTypes = Record<string,
    | 'Float32Array'
    | 'Uint32Array'
    | 'Uint16Array'
    | 'Int16Array'
    | 'Uint8Array'
    | 'Int8Array'
>;

export interface DecodeGeometryConfig {
    attributeIds: AttributeIds;
    attributeTypes: AttributeTypes;
}

export interface IndexResult {
    array: Uint32Array;
    itemSize: number;
}

export interface AttributeResult {
    name: string;
    array: AttributeData;
    itemSize: number;
    normalized?: boolean;
}

export interface GeometryData {
    index: IndexResult;
    attributes: AttributeResult[];
}

/**
 * A {@link https://github.com/google/draco | Draco 3D Data Compression} loader.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/DracoManager.js | Source}
 */
export class DracoManager {
    constructor(workerSrc: string | URL);

    initWorker(workerSrc: string | URL): void;

    onMessage(event: { data: { id: number; error: string; geometry: GeometryData } }): void;

    decodeGeometry(buffer: ArrayBuffer, config: DecodeGeometryConfig): Promise<GeometryData>;
}
