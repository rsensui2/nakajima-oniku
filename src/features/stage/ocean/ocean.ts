import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  Mesh,
  ShaderMaterial,
  Texture,
  Vector3,
  Vector4,
} from "three";
import { PALETTE } from "../palette";
import type { Quality } from "../quality";
import type { SkyUniforms } from "../sky/sky";
import { WAVE_COUNT, oceanFragmentShader, oceanVertexShader } from "./ocean-shader";

/** [方向x, 方向z, 波形勾配, 波長(m)] — 主に沖からカメラ側へ寄せる */
const WAVES: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.12, 1.0, 0.12, 24.0],
  [-0.38, 1.0, 0.1, 13.5],
  [0.55, 1.0, 0.085, 8.2],
  [-0.85, 0.55, 0.07, 5.1],
  [0.95, 0.35, 0.06, 3.4],
  [-0.2, 1.0, 0.05, 2.2],
  [0.4, -0.9, 0.04, 1.45],
  [-0.65, -0.7, 0.035, 0.95],
];

const OCEAN_RADIUS = 820;
const RING_DISTRIBUTION = 9;

/** カメラ中心の放射状グリッド（近くほど密） */
function createRadialGrid(rings: number, segments: number): BufferGeometry {
  const vertexCount = 1 + rings * segments;
  const positions = new Float32Array(vertexCount * 3);
  const norm = Math.exp(RING_DISTRIBUTION) - 1;
  for (let k = 1; k <= rings; k += 1) {
    const r = (OCEAN_RADIUS * (Math.exp((k / rings) * RING_DISTRIBUTION) - 1)) / norm;
    for (let s = 0; s < segments; s += 1) {
      const a = (s / segments) * Math.PI * 2;
      const i = 1 + (k - 1) * segments + s;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
  }
  const indices: number[] = [];
  for (let s = 0; s < segments; s += 1) {
    const next = (s + 1) % segments;
    indices.push(0, 1 + next, 1 + s);
  }
  for (let k = 1; k < rings; k += 1) {
    for (let s = 0; s < segments; s += 1) {
      const next = (s + 1) % segments;
      const a = 1 + (k - 1) * segments + s;
      const b = 1 + (k - 1) * segments + next;
      const c = 1 + k * segments + next;
      const d = 1 + k * segments + s;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

export type OceanUniforms = {
  uTime: { value: number };
  uWaveAmp: { value: number };
  uWaterLevel: { value: number };
  uCenter: { value: Vector3 };
  uReflMatrix: { value: Matrix4 };
  uReflTex: { value: Texture | null };
  uReflAmt: { value: number };
  uMicro: { value: number };
  uFogDensity: { value: number };
  uWaves: { value: Vector4[] };
  uDeep: { value: Color };
  uScatter: { value: Color };
};

export type Ocean = Readonly<{ mesh: Mesh; uniforms: OceanUniforms }>;

export function createOcean(quality: Quality, sky: SkyUniforms): Ocean {
  const uniforms: OceanUniforms = {
    uTime: sky.uTime,
    uWaveAmp: { value: 1 },
    uWaterLevel: { value: 0 },
    uCenter: { value: new Vector3() },
    uReflMatrix: { value: new Matrix4() },
    uReflTex: { value: null },
    uReflAmt: { value: 0 },
    uMicro: { value: 1 },
    uFogDensity: { value: 0.0042 },
    uWaves: { value: WAVES.slice(0, WAVE_COUNT).map(([x, z, s, l]) => new Vector4(x, z, s, l)) },
    uDeep: { value: new Color(PALETTE.waterDeep) },
    uScatter: { value: new Color(PALETTE.waterScatter) },
  };
  const material = new ShaderMaterial({
    uniforms: { ...sky, ...uniforms },
    vertexShader: oceanVertexShader,
    fragmentShader: oceanFragmentShader,
  });
  const mesh = new Mesh(createRadialGrid(quality.oceanRings, quality.oceanSegments), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -5;
  return { mesh, uniforms };
}
