import {
  Color,
  HalfFloatType,
  Matrix4,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

export const REFLECT_LAYER = 1;

const BIAS = new Matrix4().set(
  0.5, 0.0, 0.0, 0.5,
  0.0, 0.5, 0.0, 0.5,
  0.0, 0.0, 0.5, 0.5,
  0.0, 0.0, 0.0, 1.0,
);

/**
 * 水平な水面（y = level）に対する平面反射。肉だけ（REFLECT_LAYER）を描く。
 * three.js の Reflector と同じ鏡像カメラの求め方を、水面専用に簡略化したもの。
 */
export class PlanarReflection {
  readonly target: WebGLRenderTarget;
  readonly textureMatrix = new Matrix4();
  private readonly virtualCamera = new PerspectiveCamera();
  private readonly camPos = new Vector3();
  private readonly lookAt = new Vector3();
  private readonly up = new Vector3();
  private readonly prevClear = new Color();

  constructor(private scale: number) {
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
    this.virtualCamera.layers.set(REFLECT_LAYER);
  }

  setSize(width: number, height: number): void {
    this.target.setSize(
      Math.max(1, Math.floor(width * this.scale)),
      Math.max(1, Math.floor(height * this.scale)),
    );
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, level: number): void {
    camera.getWorldPosition(this.camPos);
    camera.getWorldDirection(this.lookAt).add(this.camPos);
    this.up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const vc = this.virtualCamera;
    vc.position.set(this.camPos.x, 2 * level - this.camPos.y, this.camPos.z);
    vc.up.set(this.up.x, -this.up.y, this.up.z);
    vc.lookAt(this.lookAt.x, 2 * level - this.lookAt.y, this.lookAt.z);
    vc.far = camera.far;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);

    this.textureMatrix.copy(BIAS).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);

    const prevTarget = renderer.getRenderTarget();
    const prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.prevClear);
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, vc);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(this.prevClear, prevAlpha);
  }

  dispose(): void {
    this.target.dispose();
  }
}
