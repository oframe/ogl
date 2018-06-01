const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;
attribute vec3 normal;

// Add instanced attributes just like any attribute
attribute vec3 offset;
attribute vec3 random;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;

void rotate2d(inout vec2 v, float a){
    mat2 m = mat2(cos(a), -sin(a),
                  sin(a),  cos(a));
    v = m * v;
}

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // modify using instanced attributes to make each instance unique
    // rotate around y axis
    pos *= 0.9 + random.y * 0.2;
    rotate2d(pos.zy, random.z * 0.5 * sin(uTime * random.x + random.z * 3.14));
    rotate2d(pos.xz, random.x * 6.28 + 4.0 * uTime * (random.y - 0.5));
    
    pos += offset;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform float uTime;
uniform sampler2D tMap;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 tex = texture2D(tMap, vUv).rgb;
    
    vec3 light = normalize(vec3(0.5, 1.0, -0.3));
    float shading = dot(normal, light) * 0.15;
    gl_FragColor.rgb = tex + shading;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};