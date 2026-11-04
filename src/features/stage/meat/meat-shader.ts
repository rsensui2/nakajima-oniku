import { NOISE_GLSL } from "../glsl/noise";
import { SHAPE_COEFFS } from "./cut-visuals";

const SHAPE_GLSL = /* glsl */ `
uniform float uShape[${SHAPE_COEFFS}];
float shapeR(float th) {
  float r = uShape[0];
  for (int k = 1; k <= 6; k++) {
    float fk = float(k);
    r += uShape[2 * k - 1] * cos(fk * th) + uShape[2 * k] * sin(fk * th);
  }
  return r;
}
float shapeDR(float th) {
  float d = 0.0;
  for (int k = 1; k <= 6; k++) {
    float fk = float(k);
    d += fk * (-uShape[2 * k - 1] * sin(fk * th) + uShape[2 * k] * cos(fk * th));
  }
  return d;
}
`;

export const meatVertexShader = /* glsl */ `
attribute vec4 aPolar;
uniform float uShrink;
uniform float uAge;
varying vec3 vBlockPos;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vPolar;
varying float vPart;

${NOISE_GLSL}
${SHAPE_GLSL}

void main() {
  float th = aPolar.x;
  float rho = aPolar.y;
  float z = aPolar.z;
  float part = aPolar.w;
  float k = 1.0 - uShrink;
  float r = shapeR(th) * k;
  vec2 dir = vec2(cos(th), sin(th));
  float amp = 0.004 + 0.014 * uAge;
  float bump = snoise(vec3(dir * 2.4, z * 1.6)) * amp + snoise(vec3(dir * 6.0, z * 4.0)) * amp * 0.4;

  vec3 pos;
  vec3 nrm;
  if (abs(part) < 0.5) {
    float dr = shapeDR(th) * k;
    vec2 t = vec2(dr * dir.x - r * dir.y, dr * dir.y + r * dir.x);
    pos = vec3(dir * (r + bump), z);
    nrm = vec3(normalize(vec2(t.y, -t.x)), 0.0);
  } else {
    float rim = pow(rho, 10.0);
    pos = vec3(dir * (r * rho + bump * rim), z);
    nrm = vec3(0.0, 0.0, part);
  }

  vBlockPos = pos;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * nrm);
  vPolar = vec3(th, rho, max(0.0, (1.0 - rho) * r));
  vPart = part;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const meatFragmentShader = /* glsl */ `
uniform vec3 uLightDir[3];
uniform vec3 uLightCol[3];
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform vec3 uMoonDirection;
uniform float uCellScale;
uniform float uSeamWidth;
uniform float uSeamAmount;
uniform float uThreadWidth;
uniform float uThreadAmount;
uniform float uThreadScale;
uniform float uSinew;
uniform vec3 uFatCap;
uniform float uLeanTone;
uniform float uAge;
uniform float uChart;
uniform float uFlash;
uniform float uCutZ;
uniform float uSeed;
uniform float uThin;
varying vec3 vBlockPos;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vPolar;
varying float vPart;

${NOISE_GLSL}

const float PI = 3.14159265;

vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }

float angleDiff(float a, float b) { return mod(a - b + PI, 2.0 * PI) - PI; }

float D_GGX(float NoH, float a) {
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d + 1e-6);
}

float V_Smith(float NoV, float NoL, float a) {
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / (gv + gl + 1e-5);
}

// Mikkelsen の接空間不要のバンプマッピング
vec3 perturbNormal(vec3 surfPos, vec3 surfNorm, float h, float scale) {
  vec3 sx = dFdx(surfPos);
  vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dFdx(h) * scale * r1 + dFdy(h) * scale * r2);
  return normalize(abs(det) * surfNorm - grad);
}

struct Field {
  float fat;
  float seam;
  float dist;
  float tone;
  float sinew;
};

// 幅が 0 に近い所では線を出さない（等高線のような細線が全面に出るのを防ぐ）
float ridge(float n, float width, float soft) {
  float s = soft + width * 0.35;
  return smoothstep(1.0 - width - s, 1.0 - width + s * 0.5, 1.0 - abs(n)) * smoothstep(0.006, 0.035, width);
}

// 霜降り：筋束の境目の太い脂（筋間脂肪）＋ 先細りする細いサシ ＋ 小さな脂の粒
Field marbling(vec3 bp) {
  Field f;
  vec3 wp = vec3(bp.xy * 1.1 + uSeed, bp.z * 0.3);
  vec2 w1 = vec2(snoise(wp), snoise(wp + vec3(17.3, 9.1, 4.7)));
  vec2 p1 = bp.xy + w1 * 0.3;
#ifdef MARBLING_LOW
  vec2 p2 = p1;
#else
  vec2 w2 = vec2(snoise(vec3(p1 * 2.7, bp.z * 0.5 + 5.0)), snoise(vec3(p1 * 2.7 + 11.0, bp.z * 0.5)));
  vec2 p2 = p1 + w2 * 0.07;
#endif

  vec2 q = p2 * uCellScale + uSeed * 3.0;
  vec3 vb = voronoiBorder(q);
  float d = vb.x / uCellScale;
  float aa = max(fwidth(d), 1e-4);
  float seamNoise = snoise(vec3(q * 0.42, bp.z * 0.2 + 3.1));
  float w = uSeamWidth * smoothstep(-0.6, 0.7, seamNoise) * (0.35 + 1.3 * hash12(vb.yz));
  float seam = (1.0 - smoothstep(w - aa, w + aa * 2.5, d)) * uSeamAmount;

  // 細かなサシ：筋繊維束のあいだの脂の網（細かいボロノイの境目、太さはばらつく）
  float density = smoothstep(-0.5, 0.55, snoise(vec3(p2 * 1.6 + 7.7, bp.z * 0.3)));
  vec2 q2 = p2 * uThreadScale + vec2(31.7, -12.4);
#ifndef MARBLING_LOW
  q2 += vec2(snoise(vec3(q2 * 0.85, bp.z * 0.8 + 7.0)), snoise(vec3(q2 * 0.85 + 19.0, bp.z * 0.8))) * 0.32;
#endif
  vec3 net = voronoiBorder(q2);
  float d2 = net.x / uThreadScale;
  float taper = smoothstep(-0.55, 0.65, snoise(vec3(q2 * 0.38, bp.z * 0.6 + 1.9)));
  float netW = uThreadWidth * 0.2 * taper * (0.3 + 1.3 * hash12(net.yz)) * (0.35 + 0.65 * density);
  float aa2 = max(fwidth(d2), 1e-4);
  float thread = (1.0 - smoothstep(netW - aa2, netW + aa2 * 2.0, d2)) * smoothstep(0.001, 0.004, netW);
#ifndef MARBLING_LOW
  // レース状の脂の島
  vec3 lp = vec3(p2 * uThreadScale * 1.5, bp.z * 1.1 + 2.0);
  float lace = snoise(lp) * 0.62 + snoise(lp * 2.3 + 4.1) * 0.38;
  float laceT = 0.58 - 0.38 * density * uThreadAmount;
  float laceSoft = fwidth(lace) * 0.9 + 0.05;
  thread = max(thread, smoothstep(laceT - laceSoft, laceT + laceSoft, lace) * (0.4 + 0.6 * density));
  // 小さな脂の粒（コザシ）
  float sp = snoise(vec3(p2 * uThreadScale * 4.2, bp.z * 2.0 + 5.0));
  float spSoft = fwidth(sp) + 0.02;
  thread = max(thread, smoothstep(0.76 - spSoft, 0.8 + spSoft, sp) * density * uThreadAmount * 0.9);
#endif
  float fine = clamp(thread * uThreadAmount, 0.0, 1.0);

  f.seam = seam;
  f.fat = clamp(max(seam, fine), 0.0, 1.0);
  f.dist = d;
  f.tone = hash12(vb.yz);

  float sy = bp.y - 0.03 * sin(bp.x * 3.3 + 0.6) - 0.012;
  float stp = 1.0 - smoothstep(0.5, 0.88, abs(bp.x));
  float sw = 0.022 * uSinew * stp;
  float aaS = max(fwidth(sy), 1e-4);
  f.sinew = (1.0 - smoothstep(sw - aaS, sw + aaS * 2.0, abs(sy))) * step(0.001, uSinew);
  return f;
}

vec3 chartColor(vec3 bp, Field m, float edge) {
  vec3 seaDeep = srgb(vec3(0.025, 0.085, 0.13));
  vec3 seaShallow = srgb(vec3(0.12, 0.3, 0.36));
  vec3 land = srgb(vec3(0.9, 0.85, 0.75));
  vec3 ink = srgb(vec3(0.12, 0.22, 0.27));
  vec3 lineCol = srgb(vec3(0.58, 0.78, 0.83));
  vec3 majorCol = srgb(vec3(0.86, 0.95, 0.97));
  vec3 coral = srgb(vec3(0.77, 0.36, 0.29));

  float landMask = smoothstep(0.38, 0.6, max(m.seam, m.fat * 0.9));
  float depth = smoothstep(0.0, 0.16, m.dist);
  vec3 col = mix(seaShallow, seaDeep, depth);

  float iso = m.dist * 62.0;
  float fw = max(fwidth(iso), 1e-4);
  float minor = 1.0 - smoothstep(0.0, fw * 1.3, abs(fract(iso + 0.5) - 0.5));
  float major = 1.0 - smoothstep(0.0, fw * 1.9, abs(fract(iso / 5.0 + 0.5) - 0.5) * 5.0);
  float sea = 1.0 - landMask;
  col = mix(col, lineCol, minor * 0.4 * sea);
  col = mix(col, majorCol, major * 0.72 * sea);

  vec2 g = bp.xy * 5.0;
  vec2 gc = abs(fract(g + 0.5) - 0.5);
  vec2 gw = max(fwidth(g), vec2(1e-4));
  float grid = 1.0 - min(smoothstep(0.0, gw.x, gc.x), smoothstep(0.0, gw.y, gc.y));
  col = mix(col, srgb(vec3(0.2, 0.45, 0.5)), grid * 0.38 * sea);

  vec2 cp = bp.xy - vec2(0.22, -0.16);
  float seg = PI / 8.0;
  float rl = abs(fract(atan(cp.y, cp.x) / seg + 0.5) - 0.5) * seg * length(cp);
  float rhumb = 1.0 - smoothstep(0.0, 0.0016 + fwidth(rl) * 1.2, rl);
  col = mix(col, coral, rhumb * 0.28 * sea);

  col = mix(col, land, landMask);
  float fwc = max(fwidth(landMask), 1e-3);
  float coast = 1.0 - smoothstep(0.0, fwc * 1.5 + 0.02, abs(landMask - 0.5));
  col = mix(col, ink, coast * 0.85);

  col = mix(col, coral, m.sinew * step(0.5, fract(bp.x * 22.0)) * 0.9);

  float fe = max(fwidth(edge), 1e-4) * 1.5;
  float frameA = 1.0 - smoothstep(0.0, fe, abs(edge - 0.018));
  float frameB = 1.0 - smoothstep(0.0, fe, abs(edge - 0.032));
  col = mix(col, majorCol, max(frameA, frameB * 0.6) * 0.8);
  col = mix(col, ink, 1.0 - smoothstep(0.0, 0.014, edge));
  return col;
}

void main() {
  float capF = step(0.5, abs(vPart));
  vec3 bp = vBlockPos;
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 Ng = normalize(vNormalW);

  Field m = marbling(bp);

  float ang = angleDiff(vPolar.x, uFatCap.x);
  float capProfile = exp(-(ang * ang) / max(uFatCap.y * uFatCap.y, 1e-4));
  float capT = uFatCap.z * capProfile * (0.75 + 0.5 * snoise(vec3(vPolar.x * 3.0, bp.z * 2.0, 1.3)));
  float edge = vPolar.z;
  float aaE = max(fwidth(edge), 1e-4);
  float fatCap = capF * (1.0 - smoothstep(capT - aaE, capT + aaE * 2.0, edge)) * step(0.001, uFatCap.z);
  float barkW = mix(0.004, 0.026, uAge) * (0.7 + 0.6 * snoise(vec3(vPolar.x * 5.0, bp.z, 4.2)));
  float bark = capF * (1.0 - smoothstep(barkW - aaE, barkW + aaE * 2.0, edge));

  float lod = fwidth(bp.x);
  float fineFade = 1.0 - smoothstep(0.002, 0.006, lod);
  float fiber = snoise(vec3(bp.xy * 46.0, bp.z * 6.0)) * 0.5 + 0.5;
  float grain = snoise(vec3(bp.xy * 150.0, bp.z * 18.0)) * fineFade;

  vec3 leanDeep = srgb(vec3(0.33, 0.032, 0.066));
  vec3 leanBright = srgb(vec3(0.57, 0.065, 0.1));
  float tone = clamp(uLeanTone + (m.tone - 0.5) * 0.4 + (fiber - 0.5) * 0.16 + grain * 0.05, 0.0, 1.0);
  vec3 lean = mix(leanDeep, leanBright, tone);
  vec3 fatCol = srgb(vec3(0.94, 0.875, 0.8)) * (0.94 + 0.06 * fiber);
  vec3 blush = srgb(vec3(0.86, 0.55, 0.52));
  vec3 sinewCol = srgb(vec3(0.86, 0.85, 0.88));
  vec3 barkCol = mix(srgb(vec3(0.36, 0.1, 0.085)), srgb(vec3(0.17, 0.07, 0.05)), uAge);
  vec3 fatBarkCol = mix(srgb(vec3(0.78, 0.64, 0.48)), srgb(vec3(0.38, 0.27, 0.17)), uAge);

  float fat = max(m.fat, fatCap);
  // 脂の縁は赤身が透けて淡い桃色になる
  vec3 fatMix = mix(blush, fatCol, smoothstep(0.15, 0.7, fat));
  vec3 albedo = mix(lean, fatMix, smoothstep(0.03, 0.45, fat));
  albedo = mix(albedo, sinewCol, m.sinew);

  float wrinkle = snoise(bp * vec3(16.0, 16.0, 5.0));
  float crustNoise = snoise(bp * vec3(7.0, 7.0, 2.5)) * 0.5 + 0.5;
  float sideFatCap = (1.0 - capF) * smoothstep(0.2, 0.7, capProfile) * step(0.001, uFatCap.z);
  vec3 crust = mix(barkCol * (0.65 + 0.55 * crustNoise) * (0.9 + 0.2 * wrinkle),
                   fatBarkCol * (0.75 + 0.35 * crustNoise),
                   max(sideFatCap, m.seam * 0.45 + m.fat * 0.12));
  albedo = mix(albedo, crust, 1.0 - capF);
  albedo = mix(albedo, mix(barkCol * 1.2, fatBarkCol, fatCap), bark * 0.88);

  float roughness = mix(0.4, 0.3, fat);
  roughness = mix(roughness, 0.22, m.sinew);
  roughness = mix(roughness, mix(0.55, 0.85, uAge), 1.0 - capF);
  float wet = capF * (1.0 - bark);

  float hCap = fiber * 0.5 - fat * 0.25;
  float hSide = wrinkle * 0.7 + snoise(bp * vec3(40.0, 40.0, 13.0)) * 0.3 * fineFade;
  float h = mix(hSide * (0.45 + uAge), hCap, capF);
  // 浅い角度ではバンプを弱める（外皮が白い砂粒のようにきらつくのを防ぐ）
  float grazing = smoothstep(0.05, 0.45, max(dot(Ng, V), 0.0));
  vec3 N = perturbNormal(vWorldPos, Ng, h, mix(0.0065, 0.00055, capF) * grazing);

  float NoV = max(dot(N, V), 1e-3);
  vec3 F0 = vec3(mix(0.018, 0.03, capF));
  float a = roughness * roughness;
  vec3 sssCol = mix(srgb(vec3(0.85, 0.08, 0.06)), srgb(vec3(1.0, 0.72, 0.55)), fat);
  // 光が抜けるのは薄い所だけ：輪郭のかすめ角と切り口の外周
  float rimThin = pow(1.0 - max(dot(Ng, V), 0.0), 4.0);
  float edgeThin = capF * (1.0 - smoothstep(0.0, 0.05, edge));
  float thinness = (edgeThin * 0.45 + (1.0 - capF) * rimThin * 0.35) * mix(0.25, 1.0, uThin);

  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec3 L = normalize(uLightDir[i]);
    vec3 H = normalize(L + V);
    float NoL = dot(N, L);
    float wrap = mix(0.22, 0.4, fat);
    float diff = max((NoL + wrap) / ((1.0 + wrap) * (1.0 + wrap)), 0.0);
    float NoLc = max(NoL, 0.0);
    float NoH = max(dot(N, H), 0.0);
    float VoH = max(dot(V, H), 0.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
    vec3 spec = D_GGX(NoH, a) * V_Smith(NoV, NoLc, a) * F * NoLc;
    float ac = 0.05;
    float coat = D_GGX(NoH, ac) * V_Smith(NoV, NoLc, ac) * (0.04 + 0.96 * pow(1.0 - VoH, 5.0)) * NoLc * wet;
    vec3 Ht = normalize(L + Ng * 0.35);
    float trans = pow(clamp(dot(V, -Ht), 0.0, 1.0), 4.0) * 1.6 * thinness;
    col += uLightCol[i] * (albedo * diff + (spec + coat * 0.8) * PI + sssCol * trans);
  }

  vec3 R = reflect(-V, N);
  vec3 envCol = mix(uAmbGround, uAmbSky, R.y * 0.5 + 0.5) * 2.0;
  envCol += uLightCol[1] * pow(max(dot(R, normalize(uMoonDirection)), 0.0), 60.0) * 0.5 * wet;
  float fres = 0.03 + 0.97 * pow(1.0 - NoV, 5.0);
  col += mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5) * albedo * 1.4;
  col += envCol * fres * (1.0 - roughness) * (0.15 + 0.85 * wet) * mix(0.5, 0.3, capF);

  float ring = exp(-pow((bp.z - uCutZ) / 0.009, 2.0)) * (1.0 - capF);
  col += vec3(1.0, 0.85, 0.68) * ring * uFlash * 42.0;

  if (uChart > 0.001) {
    float len = length(bp.xy);
    float jitter = snoise(vec3(bp.xy * 3.0, 1.7)) * 0.07;
    float front = uChart * 1.4 - 0.06;
    float reveal = (1.0 - smoothstep(front - 0.05, front, len + jitter)) * capF;
    float lightF = 0.8 + 0.2 * max(dot(N, normalize(uLightDir[0])), 0.0);
    col = mix(col, chartColor(bp, m, edge) * lightF * 1.1, reveal);
    float frontLine = exp(-abs(len + jitter - front) / 0.006) * (1.0 - smoothstep(0.92, 1.0, uChart)) * capF;
    col += vec3(0.55, 0.95, 1.0) * frontLine * 4.0;
    col *= mix(1.0, 0.55, uChart * (1.0 - capF));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;
