import { Vec3 } from '../math/Vec3.js';

import type { Camera } from '../core/Camera.js';

export type ZoomStyle = 'dolly' | 'fov';

export interface OrbitOptions {
    element: HTMLElement;
    enabled: boolean;
    target: Vec3;
    ease: number;
    inertia: number;
    enableRotate: boolean;
    rotateSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableZoom: boolean;
    zoomSpeed: number;
    zoomStyle: ZoomStyle;
    enablePan: boolean;
    panSpeed: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    minDistance: number;
    maxDistance: number;
}

/**
 * Orbit controls based on the three.js `OrbitControls` class, rewritten using ES6 with some
 * additions and subtractions.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Orbit.js | Source}
 * @see {@link https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js | `OrbitControls` Source}
 */
export class Orbit {
    enabled: boolean;
    target: Vec3;
    zoomStyle: ZoomStyle;

    minDistance: number;
    maxDistance: number;

    offset: Vec3;

    constructor(object: Camera, options?: Partial<OrbitOptions>);

    update(): void;

    forcePosition(): void;

    remove(): void;
}
