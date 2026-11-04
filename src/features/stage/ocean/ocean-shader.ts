import { NOISE_GLSL } from "../glsl/noise";
import { SKY_GLSL, SKY_UNIFORMS_GLSL } from "../glsl/sky";

export const WAVE_COUNT = 8;
/** 幾何で変位させる最短の波長（これより短い波は法線だけに効かせる） */
const GEOMETRY_MIN_WAVELENGTH = 2.5;

const WAVE_FUNCS = /* glsl */ `
uniform vec4 uWaves[${WAVE_COUNT}];
uniform float uWaveAmp;
`;

export const oceanVertexShader = /* glsl */ `
${WAVE_FUNCS}
uniform float uTime;
uniform float uWaterLevel;
uniform vec3 uCenter;
uniform mat4 uReflMatrix;
varying vec3 vWorld;
varying float vCrest;
varying vec4 vReflCoord;

void main() {
  vec2 xz = position.xz + uCenter.xz;
  float dist = length(position.xz);
  float fade = 1.0 - smoothstep(50.0, 240.0, dist);
  vec3 disp = vec3(0.0);
  float crest = 0.0;
  for (int i = 0; i < ${WAVE_COUNT}; i++) {
    vec4 w = uWaves[i];
    if (w.w < ${GEOMETRY_MIN_WAVELENGTH.toFixed(1)}) continue;
    float k = 6.2831853 / w.w;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(w.xy);
    float f = k * (dot(d, xz) - c * uTime);
    float st = w.z * uWaveAmp;
    float a = st / k;
    disp += vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
    crest += st * sin(f);
  }
  vec3 world = vec3(xz.x, uWaterLevel, xz.y) + disp * fade;
  vWorld = world;
  vCrest = crest * fade;
  vReflCoord = uReflMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const oceanFragmentShader = /* glsl */ `
${SKY_UNIFORMS_GLSL}
${WAVE_FUNCS}
uniform float uMicro;
uniform float uFogDensity;
uniform float uReflAmt;
uniform sampler2D uReflTex;
uniform vec3 uDeep;
uniform vec3 uScatter;
varying vec3 vWorld;
varying float vCrest;
varying vec4 vReflCoord;

${NOISE_GLSL}
${SKY_GLSL}

vec3 waveNormal(vec2 xz, float fade) {
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < ${WAVE_COUNT}; i++) {
    vec4 w = uWaves[i];
    float k = 6.2831853 / w.w;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(w.xy);
    float f = k * (dot(d, xz) - c * uTime);
    float st = w.z * uWaveAmp * (w.w < ${GEOMETRY_MIN_WAVELENGTH.toFixed(1)} ? fade : 1.0);
    float sf = sin(f);
    float cf = cos(f);
    tangent += vec3(-d.x * d.x * st * sf, d.x * st * cf, -d.x * d.y * st * sf);
    binormal += vec3(-d.x * d.y * st * sf, d.y * st * cf, -d.y * d.y * st * sf);
  }
  return normalize(cross(binormal, tangent));
}

// 毛管波による細かな傾き
vec2 microSlope(vec2 p, float t) {
  const vec3 W[6] = vec3[6](
    vec3(0.30, 0.62, 0.010),
    vec3(1.90, 0.41, 0.008),
    vec3(3.70, 0.33, 0.006),
    vec3(5.10, 0.23, 0.0045),
    vec3(2.60, 0.17, 0.0035),
    vec3(4.40, 0.12, 0.0025)
  );
  vec2 s = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    vec2 d = vec2(cos(W[i].x), sin(W[i].x));
    float k = 6.2831853 / W[i].y;
    float omega = sqrt(9.8 * k + 0.074 * k * k * k / 1000.0);
    float ph = k * dot(d, p) - omega * t;
    s += d * (W[i].z * k * cos(ph));
  }
  float n = snoise(vec3(p * 0.9, t * 0.15));
  return s * (0.7 + 0.6 * n);
}

void main() {
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float fade = 1.0 / (1.0 + dist * 0.045);

  vec3 N = waveNormal(vWorld.xz, fade);
  vec2 slope = microSlope(vWorld.xz, uTime) * uMicro * fade;
  N = normalize(N + vec3(-slope.x, 0.0, -slope.y));

  float NoV = max(dot(N, V), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
  vec3 R = reflect(-V, N);
  float flipped = step(R.y, 0.0);
  R.y = abs(R.y);

  vec3 refl = skyColor(R, 1.0 - flipped);
  vec2 ruv = vReflCoord.xy / vReflCoord.w + N.xz * 0.05;
  vec4 obj = texture2D(uReflTex, ruv);
  refl = mix(refl, obj.rgb, clamp(obj.a, 0.0, 1.0) * uReflAmt);

  float moonStrength = uMoonBright * (0.12 + 0.88 * uMoonIllum);
  float sharp = mix(2600.0, 340.0, 1.0 - fade);
  float spec = pow(max(dot(R, uMoonDir), 0.0), sharp) * sharp * 0.0018 * moonStrength * (1.0 - flipped);

  float crest = clamp(vCrest * 1.8 + 0.35, 0.0, 1.0);
  vec3 body = uDeep + uScatter * crest * (0.2 + 0.8 * moonStrength) * 0.55;

  vec3 col = mix(body, refl, fresnel) + uMoonColor * spec;

  vec3 horizonDir = normalize(vec3(-V.x, 0.015, -V.z));
  float fog = 1.0 - exp(-dist * uFogDensity);
  col = mix(col, skyBase(horizonDir) + uHorizon * uMist * 0.6, clamp(fog + uMist * 0.35, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`;
