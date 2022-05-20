/**
 * Internal program data class, storing shader data for each Program instance
 * Used for reusing a native program for different Ogl programs without re-use of base shader.
 */

let ID = 0;

export class ProgramData {
    /**
     * @type {Map<string, ProgramData>}
     */
    static CACHE = new Map();

    /**
     * Create or return already existed program data for current shaders source
     * @param {WebGLRenderingContext | WebGL2RenderingContext} gl 
     * @param {string} vertex 
     * @param {string} fragment 
     */
    static create (gl, vertex, fragment) {
        const key = vertex + fragment;
        const program = this.CACHE.get(key) || new ProgramData(gl, vertex + fragment);

        program.usage ++;

        this.CACHE.set(key, program);

        return program.compile();
    }

    static remove ()

    constructor(
        gl,
        {
            vertex,
            fragment,
        } = {}
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
    }

    compile () {
        if (this.program) {
            return this;
        }

        const gl = this.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;

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
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.warn(gl.getProgramInfoLog(this.program));
            return this;
        }

        // Remove shader once linked
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

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

        return this;
    }

    remove() {
        this.usage--;

        if (this.usage <= 0 && this.program) {
            this.gl.deleteProgram(this.program);

            ProgramData.CACHE.remove(this.vertex + this.fragment);
        }

        this.id = -1;
        this.fragment = null;
        this.vertex = null;
        this.attributeLocations.clear();
        this.attributeOrder = '';
        this.uniformLocations.clear();
    }
}