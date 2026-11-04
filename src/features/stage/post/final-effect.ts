import { Effect, EffectAttribute } from "postprocessing";
import { Uniform } from "three";

const fragmentShader = /* glsl */ `
uniform float uExposure;
uniform float uVignette;
uniform float uGrain;
uniform float uAberration;
uniform float uGrade;
uniform float uFade;

// Khronos PBR Neutral：色相を保ったまま高輝度だけを圧縮する（肉の赤がオレンジに転ばない）
vec3 neutralToneMap(vec3 color) {
  const float startCompression = 0.76;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  const float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

// 中間調を締める弱い S 字（線形空間で表示用の明るさに近い形で効かせる）
vec3 filmicContrast(vec3 c) {
  vec3 p = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
  p = mix(p, p * p * (3.0 - 2.0 * p), 0.32);
  return pow(p, vec3(2.2));
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 dir = uv - 0.5;
  float d = length(dir * vec2(aspect, 1.0)) / max(aspect, 1.0);
  vec2 off = dir * uAberration * d;
  vec3 col = vec3(texture2D(inputBuffer, uv - off).r, inputColor.g, texture2D(inputBuffer, uv + off).b);

  col = filmicContrast(clamp(neutralToneMap(col * uExposure), 0.0, 1.0));

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, col * vec3(0.9, 1.0, 1.1), (1.0 - smoothstep(0.0, 0.42, luma)) * 0.55 * uGrade);
  col = mix(col, col * vec3(1.05, 1.0, 0.93), smoothstep(0.45, 1.0, luma) * 0.45 * uGrade);

  float vig = smoothstep(1.05, 0.22, d * 1.25);
  col *= mix(1.0, vig, uVignette);

  float n = grainHash(floor(uv * resolution) + fract(time * 7.13) * 317.0) - 0.5;
  col *= 1.0 + n * uGrain * 2.0;
  col *= 1.0 - uFade;

  outputColor = vec4(max(col, vec3(0.0)), inputColor.a);
}
`;

/** 色収差・トーンマップ・グレーディング・周辺減光・粒子を1パスで */
export class FinalEffect extends Effect {
  constructor() {
    super("FinalEffect", fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uExposure", new Uniform(1)],
        ["uVignette", new Uniform(0.75)],
        ["uGrain", new Uniform(0.035)],
        ["uAberration", new Uniform(0.004)],
        ["uGrade", new Uniform(1)],
        ["uFade", new Uniform(0)],
      ]),
    });
  }

  setParams(p: Readonly<{ exposure: number; vignette: number; grain: number; aberration: number; fade: number }>): void {
    this.uniforms.get("uExposure")!.value = p.exposure;
    this.uniforms.get("uVignette")!.value = p.vignette;
    this.uniforms.get("uGrain")!.value = p.grain;
    this.uniforms.get("uAberration")!.value = p.aberration;
    this.uniforms.get("uFade")!.value = p.fade;
  }
}
