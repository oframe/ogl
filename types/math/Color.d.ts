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

export class Color extends Array<number> {
    constructor(color: [number, number, number]);
    constructor(color: number, g: number, b: number);
    constructor(color: string);
    constructor(color: 'black' | 'white' | 'red' | 'green' | 'blue' | 'fuchsia' | 'cyan' | 'yellow' | 'orange');
    constructor(color?: ColorRepresentation);
    get r(): number;
    get g(): number;
    get b(): number;
    set r(v: number);
    set g(v: number);
    set b(v: number);
    set(color: [number, number, number]): this;
    set(color: number, g: number, b: number): this;
    set(color: string): this;
    set(color: 'black' | 'white' | 'red' | 'green' | 'blue' | 'fuchsia' | 'cyan' | 'yellow' | 'orange'): this;
    set(color: number): this;
    set(color: ColorRepresentation): this;
    copy(v: Color): this;
}
