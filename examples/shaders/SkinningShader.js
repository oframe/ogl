const vertex = `
precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform sampler2D boneTexture;
uniform int boneTextureSize;

mat4 getBoneMatrix(const in float i) {
    float j = i * 4.0;
    float x = mod(j, float(boneTextureSize));
    float y = floor(j / float(boneTextureSize));

    float dx = 1.0 / float(boneTextureSize);
    float dy = 1.0 / float(boneTextureSize);

    y = dy * (y + 0.5);

    vec4 v1 = texture2D(boneTexture, vec2(dx * (x + 0.5), y));
    vec4 v2 = texture2D(boneTexture, vec2(dx * (x + 1.5), y));
    vec4 v3 = texture2D(boneTexture, vec2(dx * (x + 2.5), y));
    vec4 v4 = texture2D(boneTexture, vec2(dx * (x + 3.5), y));

    return mat4(v1, v2, v3, v4);
}

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    mat4 boneMatX = getBoneMatrix(skinIndex.x);
    mat4 boneMatY = getBoneMatrix(skinIndex.y);
    mat4 boneMatZ = getBoneMatrix(skinIndex.z);
    mat4 boneMatW = getBoneMatrix(skinIndex.w);

    // update normal
    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    vNormal = vec4(skinMatrix * vec4(vNormal, 0.0)).xyz;

    // Update position
    vec4 bindPos = vec4(position, 1.0);
    vec4 transformed = vec4(0.0);
    transformed += boneMatX * bindPos * skinWeight.x;
    transformed += boneMatY * bindPos * skinWeight.y;
    transformed += boneMatZ * bindPos * skinWeight.z;
    transformed += boneMatW * bindPos * skinWeight.w;
    vec3 pos = transformed.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform sampler2D tMap;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vec3 tex = texture2D(tMap, vUv).rgb;

    vec3 normal = normalize(vNormal);
    vec3 light = vec3(0.0, 1.0, 0.0);
    float shading = min(0.0, dot(normal, light) * 0.2);

    gl_FragColor.rgb = tex + shading;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};