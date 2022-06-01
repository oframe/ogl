/**
 * Internal program data class, storing shader data for each Program instance
 * Used for reusing a native program for different Ogl programs without re-use of base shader.
 */

let ID = 0;

export class ProgramData {
    /**
     * @type {WeakMap<WebGLRenderingContext | WebGL2RenderingContext, Map<string, ProgramData>>}
     */
    static CACHE = new Map();

    /**
     * Create or return already existed program data for current shaders source
     * @param { WebGLRenderingContext | WebGL2RenderingContext } gl 
     * @param {{ vertex: string, fragment: string}} param1 
     * @returns {ProgramData}
     */
    static create (gl, { vertex, fragment }) {
        const store = ProgramData.CACHE.get(gl);

        if (!store) return new ProgramData(gl, { vertex, fragment });

        const program = store.get(vertex + fragment);
        
        if (!program) return new ProgramData(gl, { vertex, fragment });

        program.usage ++;

        return program;
    }

    /**
     * Store program data to cache
     * @param { WebGLRenderingContext | WebGL2RenderingContext } gl
     * @param { ProgramData } programData
     * @returns { ProgramData }
     */
    static set (gl, programData) {
        const store = this.CACHE.get(gl) || new Map();

        ProgramData.CACHE.set(gl, store);

        if (store.has(programData.vertex + programData.fragment)) {
            console.warn(
                '[ProgramData cache] Already have valid program data for this source:',
                programData.vertex,
                programData.fragment
            );
        }

        store.set(programData.key, programData);

        return programData;
    }

    /**
     * @param { WebGLRenderingContext | WebGL2RenderingContext } gl
     * @param { ProgramData } programData
     */
    static delete (gl, programData) {
        if (!programData || !programData.key) return false;

        const store = ProgramData.CACHE.get(gl);

        if (!store) return false;

        return store.delete(programData.key);
    }

    constructor(
        gl,
        {
            vertex,
            fragment,
        }
    ) {
        /**
         * @type {WebGLRenderingContext | WebGL2RenderingContext}
         */
        this.gl = gl;

        /**
         * @type {string}
         */
        this.vertex = vertex;

        /**
         * @type {string}
         */
        this.fragment = fragment;

        /**
         * @type {WebGLProgram}
         */
        this.program = null;

        /**
         * @type {Map<WebGLActiveInfo, WebGLUniformLocation>}
         */
        this.uniformLocations = new Map();

        /**
         * @type {Map<WebGLActiveInfo, number>}
         */
        this.attributeLocations = new Map()

        /**
         * @type {string}
         */
        this.attributeOrder = '';

        this.id = (1 << 8) + ID++;

        this.compile();
    }

    get key() {
        return this.vertex + this.fragment;
    }

    /**
     * Compile or validate exist program
     * @returns { boolean }
     */
    compile () {        
        const gl = this.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;

        // check that compiled program still alive
        if (this.program && gl.isProgram(this.program)) {
            return true;
        }

        // delete exist program for this context
        // it can be invalid
        ProgramData.delete(gl, this);

        // compile vertex shader and log errors
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertex);
        gl.compileShader(vertexShader);
        if (gl.getShaderInfoLog(vertexShader) !== '') {
            console.warn(`${gl.getShaderInfoLog(vertexShader)}\nVertex Shader\n${addLineNumbers(vertex)}`);
        }

        // compile fragment shader and log errors
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragment);
        gl.compileShader(fragmentShader);
        if (gl.getShaderInfoLog(fragmentShader) !== '') {
            console.warn(`${gl.getShaderInfoLog(fragmentShader)}\nFragment Shader\n${addLineNumbers(fragment)}`);
        }

        // compile program and log errors
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn(gl.getProgramInfoLog(program));
            return false;
        }

        // Remove shader once linked
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        this.program = program;

        // Get active uniform locations
        let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let uIndex = 0; uIndex < numUniforms; uIndex++) {
            let uniform = gl.getActiveUniform(this.program, uIndex);
            this.uniformLocations.set(uniform, gl.getUniformLocation(this.program, uniform.name));

            // split uniforms' names to separate array and struct declarations
            const split = uniform.name.match(/(\w+)/g);

            uniform.uniformName = split[0];

            if (split.length === 3) {
                uniform.isStructArray = true;
                uniform.structIndex = Number(split[1]);
                uniform.structProperty = split[2];
            } else if (split.length === 2 && isNaN(Number(split[1]))) {
                uniform.isStruct = true;
                uniform.structProperty = split[1];
            }
        }

        // Get active attribute locations
        const locations = [];
        const numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let aIndex = 0; aIndex < numAttribs; aIndex++) {
            const attribute = gl.getActiveAttrib(this.program, aIndex);
            const location = gl.getAttribLocation(this.program, attribute.name);
            locations[location] = attribute.name;
            this.attributeLocations.set(attribute, location);
        }

        this.attributeOrder = locations.join('');

        // storing only valid programs
        ProgramData.set(gl, this);

        return true;
    }

    remove() {
        this.usage--;

        if (this.usage <= 0 && this.program) {
            this.gl.deleteProgram(this.program);

            ProgramData.delete(this.gl, this);
        }

        this.id = -1;
        this.fragment = null;
        this.vertex = null;
        this.attributeLocations.clear();
        this.attributeOrder = '';
        this.uniformLocations.clear();
    }
}

function addLineNumbers(string) {
    let lines = string.split('\n');
    for (let i = 0; i < lines.length; i++) {
        lines[i] = i + 1 + ': ' + lines[i];
    }
    return lines.join('\n');
}
