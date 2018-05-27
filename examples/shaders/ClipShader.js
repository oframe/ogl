const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;
attribute vec3 normal;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = vec4(position * 2.0, 1.0);
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform sampler2D tMap;

varying vec2 vUv;

void main() {
    gl_FragColor.rgb = texture2D(tMap, vUv).rgb;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};