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
import { Director } from "./director";
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
  onContextLost?: () => void;
}>;

const WATER_LEVEL_SCALE = 0.28;
const FRAME_BUDGET_MS = 1000 / 45;
const DPR_STEP = 0.25;
const SAMPLE_WINDOW_MS = 1500;
const POINTER_SMOOTHING = 0.06;
const STORY_SMOOTHING = 0.14;

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
  private readonly smooth = { story: 0, px: 0, py: 0, initialized: false };
  private dpr: number;
  private frameTimes: number[] = [];
  private lastSample = 0;
  private lastTime = 0;
  private firstFrameDone = false;
  private disposed = false;

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
      uLightDir: { value: [new Vector3(-0.5, 0.6, 0.7), new Vector3(0, 0.1, -1), new Vector3(0.7, -0.05, 0.5)] },
      uLightCol: { value: [new Color(PALETTE.keyLight), new Color(PALETTE.rimLight), new Color(PALETTE.fillLight)] },
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

  start(): void {
    this.renderer.setAnimationLoop(this.frame);
  }

  stop(): void {
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
    this.stop();
    this.callbacks.onContextLost?.();
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
    const time = now / 1000;
    const delta = this.lastTime ? now - this.lastTime : 16;
    this.lastTime = now;
    const input = this.input;

    const sm = this.smooth;
    if (!sm.initialized) {
      sm.story = input.story;
      sm.initialized = true;
    }
    const k = input.reducedMotion ? 1 : STORY_SMOOTHING;
    sm.story += (input.story - sm.story) * k;
    sm.px += (input.pointerX - sm.px) * POINTER_SMOOTHING;
    sm.py += (input.pointerY - sm.py) * POINTER_SMOOTHING;

    const timeScale = input.reducedMotion ? 0.35 : 1;
    const state = this.director.evaluate({
      story: sm.story,
      aspect: this.camera.aspect,
      time: time * timeScale,
      pointerX: sm.px,
      pointerY: sm.py,
      todayPhase: input.todayPhase,
      reducedMotion: input.reducedMotion,
    });

    const cam = this.camera;
    cam.position.copy(state.cameraPosition);
    cam.lookAt(state.cameraTarget);
    if (cam.fov !== state.fov) {
      cam.fov = state.fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();

    const sky = this.sky;
    sky.uTime.value = time * timeScale;
    const el = state.moonElevation;
    const az = state.moonAzimuth;
    sky.uMoonDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    sky.uMoonElong.value = (input.moonElongation * Math.PI) / 180;
    sky.uMoonSide.value = input.moonWaxing ? 1 : -1;
    sky.uMoonIllum.value = input.moonIllumination;
    sky.uStars.value = state.stars;
    sky.uClouds.value = state.clouds;
    sky.uMist.value = state.mist * 0.65;

    const waterLevel = input.normalizedLevel * WATER_LEVEL_SCALE;
    const ocean = this.ocean.uniforms;
    ocean.uWaveAmp.value = state.oceanAmp;
    ocean.uWaterLevel.value = waterLevel;
    ocean.uCenter.value.set(cam.position.x, 0, cam.position.z);
    ocean.uReflAmt.value = state.reflection;

    const moonStrength = 0.55 + 0.45 * input.moonIllumination;
    this.lights.uLightDir.value[0].copy(state.keyDirection);
    this.lights.uLightDir.value[1].copy(sky.uMoonDir.value);
    this.lights.uLightCol.value[0].set(PALETTE.keyLight).multiplyScalar(1.7 * state.keyLight);
    this.lights.uLightCol.value[1].set(PALETTE.rimLight).multiplyScalar(2.1 * state.rimLight * moonStrength);
    this.lights.uLightCol.value[2].set(PALETTE.fillLight).multiplyScalar(0.32);

    this.meat.update(state.meat, cam);
    this.mist.update(time * timeScale, state.mist, this.dpr);

    if (state.meat.visible && state.reflection > 0.01) {
      this.reflection.render(this.renderer, this.scene, cam, waterLevel);
      ocean.uReflMatrix.value.copy(this.reflection.textureMatrix);
      ocean.uReflTex.value = this.reflection.target.texture;
    } else {
      ocean.uReflAmt.value = 0;
    }

    this.post.bloom.intensity = state.bloom;
    this.post.final.setParams({
      exposure: state.exposure,
      vignette: state.vignette,
      grain: 0.016,
      aberration: 0.003,
      fade: 0,
    });
    this.post.composer.render(delta / 1000);

    if (!this.firstFrameDone) {
      this.firstFrameDone = true;
      this.callbacks.onFirstFrame?.();
    }
    this.adaptResolution(now, delta);
  };
}
