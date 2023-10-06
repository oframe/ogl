import { Vec3 } from '../../math/Vec3.js';

/**
 * Path builder.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/path/Path.js | Source}
 */
export class Path {
    tiltFunction: Function | null;

    constructor();

    moveTo(p: Vec3, tilt?: number): void;

    bezierCurveTo(cp1: Vec3, cp2: Vec3, p: Vec3, tilt?: number): this;

    quadraticCurveTo(cp: Vec3, p: Vec3, tilt?: number): this;

    lineTo(p: Vec3, tilt?: number): this;

    addSegment(segment: object): this;

    getSegments(): object[];

    updateLength(): void;

    getLength(): number;

    findSegmentIndexAtLength(len: number): [number, number];

    getPointAtLength(len: number, out?: Vec3): Vec3;

    getPointAt(t: number, out?: Vec3): Vec3;

    getTangentAtLength(len: number, out?: Vec3): number;

    getTangentAt(t: number, out?: Vec3): number;

    getTiltAtLength(len: number): number;

    getTiltAt(t: number): number;

    getPoints(divisions?: number): Vec3[];

    computeFrenetFrames(divisions?: number, closed?: boolean): { tangents: Vec3[]; normals: Vec3[]; binormals: Vec3[] };
}
