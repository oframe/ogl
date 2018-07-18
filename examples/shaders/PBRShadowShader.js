const vertex = `
precision highp float;

attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `
precision highp float;

uniform sampler2D tMap;

varying vec2 vUv;

void main() {
    float shadow = texture2D(tMap, vUv).g;
    
    gl_FragColor.rgb = vec3(0.0);
    gl_FragColor.a = shadow;
}
`;

export default {vertex, fragment};