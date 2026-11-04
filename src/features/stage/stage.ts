import {
  Color,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { TidePhase } from "@/features/tide/cuts";
import { Director, type DirectorInput, type StageState } from "./director";
import { MeatRig, type MeatLightUniforms } from "./meat/meat-rig";
import { Mist } from "./mist/mist";
import { createOcean, type Ocean } from "./ocean/ocean";
import { PlanarReflection } from "./ocean/planar-reflection";
import { PALETTE } from "./palette";
import { createPostChain, type PostChain } from "./post/composer";
import { detectQuality, type Quality } from "./quality";
import { createSkyDome, createSkyUniforms, type SkyUniforms } from "./sky/sky";

/** React 側が書き込み、描画ループが毎フレーム読む入力（描画ループ内の割り当てを避けるため可変） */
export type StageInput = {
  story: number;
  pointerX: number;
  pointerY: number;
  moonElongation: number;
  moonIllumination: number;
  moonWaxing: boolean;
  normalizedLevel: number;
  todayPhase: TidePhase;
  reducedMotion: boolean;
};

export type StageCallbacks = Readonly<{
  onFirstFrame?: () => void;
  /** コンテキストの喪失や描画中の例外で、これ以上描けなくなったとき */
  onFailure?: () => void;
}>;

const WATER_LEVEL_SCALE = 0.28;
const FRAME_BUDGET_MS = 1000 / 45;
const DPR_STEP = 0.25;
const SAMPLE_WINDOW_MS = 1500;
const POINTER_SMOOTHING = 0.06;
const STORY_SMOOTHING = 0.14;
const REFERENCE_FRAME_MS = 1000 / 60;

/** 60fps 基準の追従率を、実際のフレーム間隔に合わせて換算する（120Hz でも同じ速さで追う） */
const followRate = (perFrame: number, deltaMs: number) =>
  1 - Math.pow(1 - perFrame, Math.min(4, deltaMs / REFERENCE_FRAME_MS));

export class Stage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(35, 1, 0.05, 2400);
  private readonly quality: Quality;
  private readonly sky: SkyUniforms;
  private readonly ocean: Ocean;
  private readonly reflection: PlanarReflection;
  private readonly meat: MeatRig;
  private readonly mist: Mist;
  private readonly post: PostChain;
  private readonly director = new Director();
  private readonly lights: MeatLightUniforms;
  private readonly resizeObserver: ResizeObserver;
  private readonly colors = {
    key: new Color(PALETTE.keyLight),
    rim: new Color(PALETTE.rimLight),
    fill: new Color(PALETTE.fillLight),
  };
  private readonly smooth = { story: 0, px: 0, py: 0, initialized: false };
  private readonly directorInput: { -readonly [K in keyof DirectorInput]: DirectorInput[K] } = {
    story: 0,
    aspect: 1,
    time: 0,
    pointerX: 0,
    pointerY: 0,
    todayPhase: "rising",
    reducedMotion: false,
  };
  private readonly postParams = { exposure: 1, vignette: 0.75, grain: 0.016, aberration: 0.003, fade: 0 };
  private dpr: number;
  private frameTimes: number[] = [];
  private lastSample = 0;
  private lastTime = 0;
  private firstFrameDone = false;
  private running = false;
  private disposed = false;
  /** コンテキスト喪失や例外で止めたら、二度と描画ループを再開しない */
  private halted = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly input: StageInput,
    private readonly callbacks: StageCallbacks = {},
  ) {
    this.quality = detectQuality();
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.setClearColor(new Color(PALETTE.zenith), 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.maxDpr);
    this.renderer.setPixelRatio(this.dpr);

    this.sky = createSkyUniforms(this.quality);
    this.scene.add(createSkyDome(this.sky));
    this.ocean = createOcean(this.quality, this.sky);
    this.scene.add(this.ocean.mesh);

    this.lights = {
      uLightDir: { value: [new Vector3(0.5, 0.6, 0.7), new Vector3(0, 0.1, -1), new Vector3(0.7, -0.05, 0.5)] },
      uLightCol: { value: [this.colors.key.clone(), this.colors.rim.clone(), this.colors.fill.clone()] },
      uAmbSky: { value: new Color(PALETTE.ambientSky) },
      uAmbGround: { value: new Color(PALETTE.ambientGround) },
      uMoonDirection: { value: this.sky.uMoonDir.value },
    };
    this.meat = new MeatRig(this.quality, this.lights);
    this.scene.add(this.meat.group);
    this.mist = new Mist(this.quality.mistCount);
    this.scene.add(this.mist.points);

    this.reflection = new PlanarReflection(this.quality.reflectionScale);
    this.post = createPostChain(this.renderer, this.scene, this.camera, this.quality);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
  }

  /**
   * 重いシェーダー（肉・海）を最初の描画の前にまとめてコンパイルする。
   * 肉はスクロールの途中で初めて見えるので、ここで済ませておかないとその瞬間に止まる。
   */
  async prepare(): Promise<void> {
    this.meat.group.visible = true;
    this.mist.points.visible = true;
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (error) {
      console.error("Shader precompile failed:", error);
    }
  }

  start(): void {
    if (this.disposed || this.halted || this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.renderer.setAnimationLoop(this.frame);
  }

  stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.meat.dispose();
    this.mist.dispose();
    this.reflection.dispose();
    this.post.composer.dispose();
    this.scene.traverse((obj) => {
      const mesh = obj as { geometry?: { dispose(): void }; material?: { dispose(): void } };
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    });
    this.renderer.dispose();
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.halted = true;
    this.stop();
    this.callbacks.onFailure?.();
  };

  private resize(): void {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(width, height, false);
    this.post.composer.setSize(width, height, false);
    this.reflection.setSize(width * this.dpr, height * this.dpr);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private adaptResolution(now: number, delta: number): void {
    this.frameTimes.push(delta);
    if (now - this.lastSample < SAMPLE_WINDOW_MS) return;
    this.lastSample = now;
    const samples = this.frameTimes;
    this.frameTimes = [];
    if (samples.length < 20) return;
    const sorted = [...samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > FRAME_BUDGET_MS && this.dpr > this.quality.minDpr) {
      this.dpr = Math.max(this.quality.minDpr, this.dpr - DPR_STEP);
      this.resize();
    }
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    try {
      const delta = this.lastTime ? now - this.lastTime : REFERENCE_FRAME_MS;
      this.lastTime = now;
      const time = (now / 1000) * (this.input.reducedMotion ? 0.35 : 1);
      const state = this.director.evaluate(this.prepareDirectorInput(time, delta));
      this.applyCamera(state);
      this.applySky(state, time);
      const waterLevel = this.applyOcean(state);
      this.applyLights(state);
      this.meat.update(state.meat, this.camera);
      this.mist.update(time, state.mist, this.dpr);
      this.render(state, waterLevel, delta);
      if (!this.firstFrameDone) {
        this.firstFrameDone = true;
        this.callbacks.onFirstFrame?.();
      }
      this.adaptResolution(now, delta);
    } catch (error) {
      console.error("3D stage frame failed:", error);
      this.halted = true;
      this.stop();
      this.callbacks.onFailure?.();
    }
  };

  private prepareDirectorInput(time: number, delta: number): DirectorInput {
    const { input, smooth } = this;
    if (!smooth.initialized) {
      smooth.story = input.story;
      smooth.initialized = true;
    }
    smooth.story += (input.story - smooth.story) * (input.reducedMotion ? 1 : followRate(STORY_SMOOTHING, delta));
    const pointerK = followRate(POINTER_SMOOTHING, delta);
    smooth.px += (input.pointerX - smooth.px) * pointerK;
    smooth.py += (input.pointerY - smooth.py) * pointerK;

    const d = this.directorInput;
    d.story = smooth.story;
    d.aspect = this.camera.aspect;
    d.time = time;
    d.pointerX = smooth.px;
    d.pointerY = smooth.py;
    d.todayPhase = input.todayPhase;
    d.reducedMotion = input.reducedMotion;
    return d;
  }

  private applyCamera(state: StageState): void {
    const cam = this.camera;
    cam.position.copy(state.cameraPosition);
    cam.lookAt(state.cameraTarget);
    if (cam.fov !== state.fov) {
      cam.fov = state.fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();
  }

  private applySky(state: StageState, time: number): void {
    const { sky, input } = this;
    sky.uTime.value = time;
    const el = state.moonElevation;
    const az = state.moonAzimuth;
    sky.uMoonDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    sky.uMoonElong.value = (input.moonElongation * Math.PI) / 180;
    sky.uMoonSide.value = input.moonWaxing ? 1 : -1;
    sky.uMoonIllum.value = input.moonIllumination;
    sky.uStars.value = state.stars;
    sky.uClouds.value = state.clouds;
    sky.uMist.value = state.mist * 0.65;
  }

  private applyOcean(state: StageState): number {
    const waterLevel = this.input.normalizedLevel * WATER_LEVEL_SCALE;
    const ocean = this.ocean.uniforms;
    ocean.uWaveAmp.value = state.oceanAmp;
    ocean.uWaterLevel.value = waterLevel;
    ocean.uCenter.value.set(this.camera.position.x, 0, this.camera.position.z);
    ocean.uReflAmt.value = state.reflection;
    return waterLevel;
  }

  private applyLights(state: StageState): void {
    const moonStrength = 0.55 + 0.45 * this.input.moonIllumination;
    const dirs = this.lights.uLightDir.value;
    const cols = this.lights.uLightCol.value;
    dirs[0].copy(state.keyDirection);
    dirs[1].copy(this.sky.uMoonDir.value);
    cols[0].copy(this.colors.key).multiplyScalar(1.7 * state.keyLight);
    cols[1].copy(this.colors.rim).multiplyScalar(2.1 * state.rimLight * moonStrength);
    cols[2].copy(this.colors.fill).multiplyScalar(0.32);
  }

  private render(state: StageState, waterLevel: number, delta: number): void {
    const ocean = this.ocean.uniforms;
    if (state.meat.visible && state.reflection > 0.01) {
      this.reflection.render(this.renderer, this.scene, this.camera, waterLevel);
      ocean.uReflMatrix.value.copy(this.reflection.textureMatrix);
      ocean.uReflTex.value = this.reflection.target.texture;
    } else {
      ocean.uReflAmt.value = 0;
    }
    this.post.bloom.intensity = state.bloom;
    this.postParams.exposure = state.exposure;
    this.postParams.vignette = state.vignette;
    this.post.final.setParams(this.postParams);
    this.post.composer.render(delta / 1000);
  }
}
