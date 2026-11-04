/**
 * 夜空・月・雲の解析的な放射輝度。空のドームと海面の反射で共有する。
 * 月の欠け方は実際の離角（uMoonElong）から求める。
 */
export const SKY_UNIFORMS_GLSL = /* glsl */ `
uniform vec3 uMoonDir;
uniform float uMoonElong;
uniform float uMoonSide;
uniform float uMoonRadius;
uniform float uMoonBright;
uniform float uMoonIllum;
uniform float uStars;
uniform float uClouds;
uniform float uMist;
uniform float uTime;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uMoonColor;
uniform int uCloudOctaves;
`;

export const SKY_GLSL = /* glsl */ `
vec3 moonFrameRight() { return normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0))); }

// 月面の放射輝度。coverage に円盤の被覆率を返す。
vec3 moonDisk(vec3 d, out float coverage) {
  coverage = 0.0;
  float cosA = dot(d, uMoonDir);
  if (cosA < 0.985) return vec3(0.0);
  vec3 right = moonFrameRight();
  vec3 up = cross(right, uMoonDir);
  vec2 uv = vec2(dot(d, right), dot(d, up)) / (cosA * tan(uMoonRadius));
  float r = length(uv);
  coverage = 1.0 - smoothstep(0.965, 1.0, r);
  if (coverage <= 0.0) return vec3(0.0);
  vec3 n = vec3(uv, sqrt(max(0.0, 1.0 - r * r)));
  // 離角 0–180°（満ちていく月）は右、180–360°（欠けていく月）は左が光る。
  // 明暗境界は黄道の傾きを模して少し傾ける。
  float tilt = 0.42 * uMoonSide;
  vec3 sunL = vec3(sin(uMoonElong) * cos(tilt), abs(sin(uMoonElong)) * sin(tilt), -cos(uMoonElong));
  float lit = smoothstep(-0.035, 0.09, dot(n, normalize(sunL)));
  float maria = fbm2(uv * 1.9 + vec2(3.7, 1.3), 4);
  float craters = fbm2(uv * 7.0 + 11.0, 3);
  float albedo = mix(0.58, 1.0, smoothstep(0.32, 0.62, maria)) * (0.86 + 0.14 * craters);
  float limb = 0.82 + 0.18 * n.z;
  float earthshine = 0.018;
  return uMoonColor * albedo * limb * (lit + earthshine) * uMoonBright * 9.0;
}

vec3 skyBase(vec3 d) {
  float y = d.y;
  float h = 1.0 - smoothstep(-0.03, 0.42, y);
  vec3 col = mix(uZenith, uHorizon, pow(h, 1.8));
  float ca = max(dot(d, uMoonDir), 0.0);
  float glow = pow(ca, 1400.0) * 1.2 + pow(ca, 120.0) * 0.12 + pow(ca, 14.0) * 0.025;
  col += uMoonColor * glow * uMoonBright * (0.3 + 0.7 * uMoonIllum);
  return col;
}

float starField(vec3 d) {
  vec3 p = d * 240.0;
  vec3 cell = floor(p);
  float h = hash13(cell);
  if (h < 0.982) return 0.0;
  vec3 off = (hash33(cell) - 0.5) * 0.6;
  float dist = length(fract(p) - 0.5 - off);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + h * 4.0) + h * 61.0);
  float mag = (h - 0.982) / 0.018;
  return smoothstep(0.16, 0.0, dist) * mag * mag * twinkle * 2.2;
}

float cloudDensity(vec3 d) {
  if (d.y <= 0.0 || uClouds <= 0.0) return 0.0;
  vec2 uv = d.xz / (d.y + 0.16) * 0.85 + vec2(uTime * 0.006, uTime * 0.0025);
  float n = fbm2(uv * 0.9, uCloudOctaves);
  float band = smoothstep(0.02, 0.12, d.y) * (1.0 - smoothstep(0.3, 0.6, d.y));
  return smoothstep(0.5, 0.82, n) * band * uClouds;
}

vec3 skyColor(vec3 d, float withMoon) {
  vec3 col = skyBase(d);
  float ca = max(dot(d, uMoonDir), 0.0);
  float starMask = smoothstep(0.03, 0.3, d.y) * (1.0 - pow(ca, 30.0));
  col += vec3(0.78, 0.86, 1.0) * starField(d) * uStars * starMask;

  float coverage;
  vec3 moon = moonDisk(d, coverage);
  col = mix(col, moon * (1.0 - uMist * 0.8) + col * 0.3, coverage * withMoon);

  float cl = cloudDensity(d);
  vec3 cloudCol = mix(uZenith * 1.2 + vec3(0.002, 0.004, 0.007),
                      uMoonColor * 0.2 * uMoonBright,
                      pow(ca, 22.0) * (0.35 + 0.65 * uMoonIllum));
  col = mix(col, cloudCol, cl);

  col = mix(col, uHorizon * 1.35 + uMoonColor * 0.02, uMist * (1.0 - smoothstep(-0.05, 0.55, d.y)));
  return col;
}
`;
