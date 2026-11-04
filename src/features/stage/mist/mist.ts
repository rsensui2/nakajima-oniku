import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";

const BOX_MIN = new Vector3(-6, 0.1, -4.5);
const BOX_SIZE = new Vector3(12, 2.6, 8);

const vertexShader = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uMist;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uBoxMin;
uniform vec3 uBoxSize;
varying float vAlpha;
void main() {
  vec3 p = position;
  float speed = 0.12 + aSeed * 0.22;
  p.x = uBoxMin.x + mod(p.x - uBoxMin.x + uTime * speed, uBoxSize.x);
  p.y += sin(uTime * 0.27 + aSeed * 21.0) * 0.12;
  p.z += cos(uTime * 0.21 + aSeed * 13.0) * 0.14;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.45 + aSeed) * uPixelRatio * (6.0 / max(-mv.z, 0.5));
  float ex = (p.x - uBoxMin.x) / uBoxSize.x;
  vAlpha = smoothstep(0.0, 0.18, ex) * smoothstep(1.0, 0.82, ex) * uMist * smoothstep(0.3, 2.0, -mv.z);
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(c));
  a = a * a * vAlpha;
  gl_FragColor = vec4(vec3(0.42, 0.56, 0.64) * a * 0.22, a * 0.22);
}
`;

/** 浜風の湿気（熟成のシーンで漂う霧の粒） */
export class Mist {
  readonly points: Points;
  private readonly material: ShaderMaterial;

  constructor(count: number) {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = BOX_MIN.x + Math.random() * BOX_SIZE.x;
      positions[i * 3 + 1] = BOX_MIN.y + Math.random() * BOX_SIZE.y;
      positions[i * 3 + 2] = BOX_MIN.z + Math.random() * BOX_SIZE.z;
      seeds[i] = Math.random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    this.material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMist: { value: 0 },
        uSize: { value: 90 },
        uPixelRatio: { value: 1 },
        uBoxMin: { value: BOX_MIN },
        uBoxSize: { value: BOX_SIZE },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.points = new Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
  }

  update(time: number, amount: number, pixelRatio: number): void {
    this.points.visible = amount > 0.002;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uMist.value = amount;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
