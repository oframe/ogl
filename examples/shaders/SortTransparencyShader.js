const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;
varying vec4 vMVPos;

void main() {
    vUv = uv;
    vec3 pos = position;
    float dist = pow(length(vUv - 0.5), 2.0) - 0.25;
    pos.z += dist * 0.5;
    vMVPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * vMVPos;
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform sampler2D tMap;
uniform vec3 uColor;

varying vec2 vUv;
varying vec4 vMVPos;

void main() {
    float alpha = texture2D(tMap, vUv).g;
    
    vec3 color = uColor + vMVPos.xzy * 0.05;
    
    float dist = length(vMVPos);
    float fog = smoothstep(5.0, 10.0, dist);
    color = mix(color, vec3(1.0), fog);
    
    gl_FragColor.rgb = color;
    gl_FragColor.a = alpha;
    if (alpha < 0.01) discard;
}
`;

export default {vertex, fragment};