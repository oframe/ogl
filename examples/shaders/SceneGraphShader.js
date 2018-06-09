const vertex = `
precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vNormal;
varying vec4 vMVPos;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    vMVPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vMVPos;
}
`;

const fragment = `
precision highp float;
precision highp int;

varying vec3 vNormal;
varying vec4 vMVPos;

void main() {
    vec3 normal = normalize(vNormal);
    float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
    vec3 color = vec3(1.0, 0.5, 0.2) * (1.0 - 0.5 * lighting) + vMVPos.xzy * 0.1;
    
    float dist = length(vMVPos);
    float fog = smoothstep(4.0, 10.0, dist);
    color = mix(color, vec3(1.0), fog);
    
    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};