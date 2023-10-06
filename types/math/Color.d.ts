export type ColorTuple = [r: number, g: number, b: number];

export type ColorRepresentation =
    | number
    | 'black'
    | 'white'
    | 'red'
    | 'green'
    | 'blue'
    | 'fuchsia'
    | 'cyan'
    | 'yellow'
    | 'orange'
    | string
    | ColorTuple;

/**
 * Represents a color.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/math/Color.js | Source}
 */
export class Color extends Array<number> {
    constructor(color?: number | Color | ColorRepresentation, g?: number, b?: number);

    get r(): number;

    get g(): number;

    get b(): number;

    set r(v: number);

    set g(v: number);

    set b(v: number);

    set(color?: number | Color | ColorRepresentation, g?: number, b?: number): this;

    copy(v: Color): this;
}
