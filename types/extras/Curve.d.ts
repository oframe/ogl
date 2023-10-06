import { Vec3 } from '../math/Vec3.js';

export type CurveType = 'catmullrom' | 'cubicbezier' | 'quadraticbezier';

export interface CurveOptions {
    points: Vec3[];
    divisions: number;
    type: CurveType;
}

/**
 * A class for creating curves.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Curve.js | Source}
 */
export class Curve {
    static CATMULLROM: 'catmullrom';
    static CUBICBEZIER: 'cubicbezier';
    static QUADRATICBEZIER: 'quadraticbezier';

    points: Vec3[];
    divisions: number;
    type: CurveType;

    constructor(options?: Partial<CurveOptions>);

    getPoints(divisions?: number, a?: number, b?: number): Vec3[];
}
