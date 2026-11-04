import {
  Color,
  Euler,
  Group,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { REFLECT_LAYER } from "../ocean/planar-reflection";
import type { Quality } from "../quality";
import { SHAPE_COEFFS, type CutVisual } from "./cut-visuals";
import { createCutGeometry } from "./meat-geometry";
import { meatFragmentShader, meatVertexShader } from "./meat-shader";

export const BLOCK_Z_START = -0.85;
export const BLOCK_Z_END = 0.85;
export const CUT_Z = 0.62;
const SLICE_CENTER_Z = (CUT_Z + BLOCK_Z_END) / 2;
const SEPARATION_DISTANCE = 0.5;
const ARC_LIFT = 0.22;
const MARBLING_SEED = 4.17;
const UP = new Vector3(0, 1, 0);

export type MeatLightUniforms = {
  uLightDir: { value: Vector3[] };
  uLightCol: { value: Color[] };
  uAmbSky: { value: Color };
  uAmbGround: { value: Color };
  uMoonDirection: { value: Vector3 };
};

/** 1フレーム分の肉の状態（director が毎フレーム書き換える） */
export type MeatFrame = {
  visible: boolean;
  blockVisible: boolean;
  blockPosition: Vector3;
  blockRotation: Vector3;
  sliceSeparation: number;
  slicePresent: number;
  presentPosition: Vector3;
  presentRotation: Vector3;
  flash: number;
  chart: number;
  age: number;
  blockVisual: CutVisual;
  sliceVisual: CutVisual;
};

const easeInOut = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function createMaterial(lights: MeatLightUniforms, quality: Quality): ShaderMaterial {
  return new ShaderMaterial({
    defines: quality.tier === "low" ? { MARBLING_LOW: "" } : {},
    uniforms: {
      ...lights,
      uShape: { value: new Array<number>(SHAPE_COEFFS).fill(0) },
      uCellScale: { value: 3 },
      uSeamWidth: { value: 0.02 },
      uSeamAmount: { value: 1 },
      uThreadWidth: { value: 0.1 },
      uThreadAmount: { value: 1 },
      uThreadScale: { value: 9 },
      uSinew: { value: 0 },
      uFatCap: { value: new Vector3() },
      uLeanTone: { value: 0.5 },
      uShrink: { value: 0 },
      uAge: { value: 1 },
      uChart: { value: 0 },
      uFlash: { value: 0 },
      uCutZ: { value: CUT_Z },
      uSeed: { value: MARBLING_SEED },
      uThin: { value: 0 },
    },
    vertexShader: meatVertexShader,
    fragmentShader: meatFragmentShader,
  });
}

function applyVisual(material: ShaderMaterial, v: CutVisual): void {
  const u = material.uniforms;
  const shape = u.uShape.value as number[];
  for (let i = 0; i < SHAPE_COEFFS; i += 1) shape[i] = v.shape[i];
  u.uCellScale.value = v.cellScale;
  u.uSeamWidth.value = v.seamWidth;
  u.uSeamAmount.value = v.seamAmount;
  u.uThreadWidth.value = v.threadWidth;
  u.uThreadAmount.value = v.threadAmount;
  u.uThreadScale.value = v.threadScale;
  u.uSinew.value = v.sinew;
  (u.uFatCap.value as Vector3).set(v.fatCapAngle, v.fatCapWidth, v.fatCapThickness);
  u.uLeanTone.value = v.leanTone;
}

/**
 * 熟成肉の塊と、そこから切り出す一枚。
 * 両者は同じ「塊の座標系」でサシを評価するので、切り口の模様は必ず一致する。
 */
export class MeatRig {
  readonly group = new Group();
  private readonly blockRoot = new Group();
  private readonly slicePivot = new Group();
  private readonly blockMaterial: ShaderMaterial;
  private readonly sliceMaterial: ShaderMaterial;
  private readonly materials: readonly ShaderMaterial[];
  private readonly attachedPos = new Vector3();
  private readonly attachedQuat = new Quaternion();
  private readonly presentQuat = new Quaternion();
  private readonly offsetQuat = new Quaternion();
  private readonly lookMatrix = new Matrix4();
  private readonly euler = new Euler();

  constructor(quality: Quality, lights: MeatLightUniforms) {
    const thetaSegments = quality.thetaSegments;
    const blockGeometry = createCutGeometry({
      zStart: BLOCK_Z_START,
      zEnd: CUT_Z,
      thetaSegments,
      zSegments: 20,
      capRings: 22,
    });
    const sliceGeometry = createCutGeometry({
      zStart: CUT_Z,
      zEnd: BLOCK_Z_END,
      thetaSegments,
      zSegments: 3,
      capRings: 26,
    });
    this.blockMaterial = createMaterial(lights, quality);
    this.sliceMaterial = createMaterial(lights, quality);
    this.sliceMaterial.uniforms.uThin.value = 1;
    this.materials = [this.blockMaterial, this.sliceMaterial];

    const block = new Mesh(blockGeometry, this.blockMaterial);
    const slice = new Mesh(sliceGeometry, this.sliceMaterial);
    slice.position.set(0, 0, -SLICE_CENTER_Z);
    for (const mesh of [block, slice]) {
      mesh.frustumCulled = false;
      mesh.layers.enable(REFLECT_LAYER);
    }
    this.blockRoot.add(block);
    this.slicePivot.add(slice);
    this.group.add(this.blockRoot, this.slicePivot);
  }

  update(frame: MeatFrame, camera: PerspectiveCamera): void {
    this.group.visible = frame.visible;
    if (!frame.visible) return;

    this.blockRoot.visible = frame.blockVisible;
    this.blockRoot.position.copy(frame.blockPosition);
    this.blockRoot.rotation.set(frame.blockRotation.x, frame.blockRotation.y, frame.blockRotation.z);
    this.blockRoot.updateMatrixWorld();

    this.attachedPos
      .set(0, 0, SLICE_CENTER_Z + frame.sliceSeparation * SEPARATION_DISTANCE)
      .applyMatrix4(this.blockRoot.matrixWorld);
    this.blockRoot.getWorldQuaternion(this.attachedQuat);

    this.lookMatrix.lookAt(camera.position, frame.presentPosition, UP);
    this.presentQuat.setFromRotationMatrix(this.lookMatrix);
    this.euler.set(frame.presentRotation.x, frame.presentRotation.y, frame.presentRotation.z);
    this.offsetQuat.setFromEuler(this.euler);
    this.presentQuat.multiply(this.offsetQuat);

    const p = easeInOut(Math.min(1, Math.max(0, frame.slicePresent)));
    this.slicePivot.position.lerpVectors(this.attachedPos, frame.presentPosition, p);
    this.slicePivot.position.y += Math.sin(Math.PI * p) * ARC_LIFT;
    this.slicePivot.quaternion.slerpQuaternions(this.attachedQuat, this.presentQuat, p);

    applyVisual(this.blockMaterial, frame.blockVisual);
    applyVisual(this.sliceMaterial, frame.sliceVisual);
    const shrink = frame.age * 0.045;
    for (const material of this.materials) {
      material.uniforms.uAge.value = frame.age;
      material.uniforms.uShrink.value = shrink;
      material.uniforms.uFlash.value = frame.flash;
    }
    this.sliceMaterial.uniforms.uChart.value = frame.chart;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof Mesh) obj.geometry.dispose();
    });
    this.blockMaterial.dispose();
    this.sliceMaterial.dispose();
  }
}
