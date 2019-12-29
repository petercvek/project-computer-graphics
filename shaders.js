const vertex = `#version 300 es

// POSITION   : 0,
// NORMAL     : 1,
// TANGENT    : 2,
// TEXCOORD_0 : 3,
// TEXCOORD_1 : 4,
// COLOR_0    : 5,
// JOINTS_0   : 6,
// WEIGHTS_0  : 7,

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 3) in vec2 aTexCoord;

uniform mat4 uModelViewProjection;

out vec2 vTexCoord;
out float distFromCenter;
out vec4 transformedNormal;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
    distFromCenter = distance(aPosition.xyz, vec3(0.0));
    transformedNormal = aPosition * vec4(aNormal, 0.0);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;
in float distFromCenter;
in vec4 transformedNormal;

out vec4 oColor;

void main() {
    vec4 texColor =  texture(uTexture, vTexCoord);

    vec3 ambientLightIntensity = vec3(0.8, 0.8, 0.8);
    vec3 directionalLightIntensity = vec3(1, 0.9, 0.6);
    vec3 directionalVector = normalize(vec3(-0.85, 0.5, +1.5));

    float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vec3 vLighting = ambientLightIntensity + (directionalLightIntensity * directional);

    oColor = vec4(texColor.rgb * vLighting, texColor.a);
    // oColor = texColor;
}
`;

export default {
  simple: { vertex, fragment }
};
