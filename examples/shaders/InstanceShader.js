const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;

// Add instanced attributes just like any attribute
attribute vec3 offset;
attribute vec3 random;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;

void rotate2d(inout vec2 v, float a){
    mat2 m = mat2(cos(a), -sin(a), sin(a),  cos(a));
    v = m * v;
}

void main() {
    vUv = uv;
    
    // copy position so that we can modify the instances
    vec3 pos = position;
    
    // scale first
    pos *= 0.9 + random.y * 0.2;
    
    // rotate around y axis
    rotate2d(pos.xz, random.x * 6.28 + 4.0 * uTime * (random.y - 0.5));
    
    // rotate around x axis just to add some extra variation
    rotate2d(pos.zy, random.z * 0.5 * sin(uTime * random.x + random.z * 3.14));
    
    pos += offset;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);;
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform float uTime;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
    vec3 tex = texture2D(tMap, vUv).rgb;
    
    gl_FragColor.rgb = tex;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};