import { BufferAttribute, BufferGeometry } from "three";

export type CutGeometryOptions = Readonly<{
  zStart: number;
  zEnd: number;
  thetaSegments: number;
  zSegments: number;
  capRings: number;
}>;

const PLACEHOLDER_RADIUS = 0.8;

/**
 * 断面輪郭 r(θ) を押し出した「肉の塊」。頂点位置はシェーダで r(θ) から計算するため、
 * ここでは極座標の属性 aPolar = (θ, ρ, z, 部位) だけを作る。部位: 0 = 側面（外皮）, ±1 = 切り口。
 */
export function createCutGeometry(opts: CutGeometryOptions): BufferGeometry {
  const { zStart, zEnd, thetaSegments: T, zSegments: Z, capRings: R } = opts;
  const polar: number[] = [];
  const indices: number[] = [];

  const pushVertex = (theta: number, rho: number, z: number, part: number) => {
    polar.push(theta, rho, z, part);
    return polar.length / 4 - 1;
  };

  // 側面
  const sideBase = polar.length / 4;
  for (let j = 0; j <= Z; j += 1) {
    const z = zStart + ((zEnd - zStart) * j) / Z;
    for (let i = 0; i <= T; i += 1) {
      pushVertex((i / T) * Math.PI * 2, 1, z, 0);
    }
  }
  for (let j = 0; j < Z; j += 1) {
    for (let i = 0; i < T; i += 1) {
      const a = sideBase + j * (T + 1) + i;
      const b = a + 1;
      const d = a + (T + 1);
      const c = d + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  // 切り口（両端）
  const addCap = (z: number, sign: 1 | -1) => {
    const center = pushVertex(0, 0, z, sign);
    const ringStart = polar.length / 4;
    for (let k = 1; k <= R; k += 1) {
      const rho = 1 - Math.pow(1 - k / R, 1.35);
      for (let i = 0; i <= T; i += 1) {
        pushVertex((i / T) * Math.PI * 2, rho, z, sign);
      }
    }
    const ring = (k: number, i: number) => ringStart + (k - 1) * (T + 1) + i;
    for (let i = 0; i < T; i += 1) {
      if (sign > 0) indices.push(center, ring(1, i), ring(1, i + 1));
      else indices.push(center, ring(1, i + 1), ring(1, i));
    }
    for (let k = 1; k < R; k += 1) {
      for (let i = 0; i < T; i += 1) {
        const a = ring(k, i);
        const b = ring(k, i + 1);
        const c = ring(k + 1, i + 1);
        const d = ring(k + 1, i);
        if (sign > 0) indices.push(a, d, b, b, d, c);
        else indices.push(a, b, d, b, c, d);
      }
    }
  };
  addCap(zEnd, 1);
  addCap(zStart, -1);

  const count = polar.length / 4;
  const positions = new Float32Array(count * 3);
  for (let v = 0; v < count; v += 1) {
    const theta = polar[v * 4];
    const rho = polar[v * 4 + 1];
    positions[v * 3] = Math.cos(theta) * rho * PLACEHOLDER_RADIUS;
    positions[v * 3 + 1] = Math.sin(theta) * rho * PLACEHOLDER_RADIUS;
    positions[v * 3 + 2] = polar[v * 4 + 2];
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aPolar", new BufferAttribute(new Float32Array(polar), 4));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
