import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import { NOISE_GLSL } from "../glsl/noise";
import { SKY_GLSL, SKY_UNIFORMS_GLSL } from "../glsl/sky";
import type { Quality } from "../quality";
import { PALETTE } from "../palette";

export type SkyUniforms = {
  uMoonDir: { value: Vector3 };
  uMoonElong: { value: number };
  uMoonSide: { value: number };
  uMoonRadius: { value: number };
  uMoonBright: { value: number };
  uMoonIllum: { value: number };
  uStars: { value: number };
  uClouds: { value: number };
  uMist: { value: number };
  uTime: { value: number };
  uZenith: { value: Color };
  uHorizon: { value: Color };
  uMoonColor: { value: Color };
  uCloudOctaves: { value: number };
};

const DOME_RADIUS = 900;
const MOON_ANGULAR_RADIUS = 0.034;

export function createSkyUniforms(quality: Quality): SkyUniforms {
  return {
    uMoonDir: { value: new Vector3(0, 0.1, -1).normalize() },
    uMoonElong: { value: Math.PI * 0.7 },
    uMoonSide: { value: -1 },
    uMoonRadius: { value: MOON_ANGULAR_RADIUS },
    uMoonBright: { value: 1 },
    uMoonIllum: { value: 0.5 },
    uStars: { value: 1 },
    uClouds: { value: 0.55 },
    uMist: { value: 0 },
    uTime: { value: 0 },
    uZenith: { value: new Color(PALETTE.zenith) },
    uHorizon: { value: new Color(PALETTE.horizon) },
    uMoonColor: { value: new Color(PALETTE.moon) },
    uCloudOctaves: { value: quality.tier === "low" ? 3 : 5 },
  };
}

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w; // 常に最奥
}
`;

const fragmentShader = /* glsl */ `
${SKY_UNIFORMS_GLSL}
varying vec3 vDir;
${NOISE_GLSL}
${SKY_GLSL}
void main() {
  gl_FragColor = vec4(skyColor(normalize(vDir), 1.0), 1.0);
}
`;

export function createSkyDome(uniforms: SkyUniforms): Mesh {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new Mesh(new SphereGeometry(DOME_RADIUS, 64, 32), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}
