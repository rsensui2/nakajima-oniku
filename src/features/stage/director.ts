import { Vector3 } from "three";
import { PHASE_ORDER, type TidePhase } from "@/features/tide/cuts";
import {
  CUT_VISUALS,
  createMutableVisual,
  mixVisualInto,
  type MutableCutVisual,
} from "./meat/cut-visuals";
import type { MeatFrame } from "./meat/meat-rig";
import { PHASE_STEP, storyIndex } from "./story";
import { evalNum, evalVec, smoothstep, type NumKey, type VecKey } from "./tracks";

const PHASES_AT = storyIndex("phases");

// ---- カメラ（横長レイアウト） ----
const CAM_POS: readonly VecKey[] = [
  [0.0, [0, 2.3, 9.0]],
  [0.7, [0, 2.0, 7.6]],
  [1.0, [0.3, 1.75, 6.8]],
  [1.65, [0.2, 1.6, 6.4]],
  [2.0, [0.3, 1.42, 5.0]],
  [2.55, [0.05, 1.32, 4.4]],
  [3.0, [0, 1.22, 3.4]],
  [3.45, [0.1, 1.2, 3.55]],
  [3.85, [0.1, 1.2, 3.5], "linear"],
  [4.05, [0.1, 1.3, 5.3]],
  [4.75, [0.15, 1.3, 5.2]],
  [5.05, [-0.2, 1.5, 5.6]],
  [5.75, [0.5, 1.36, 5.1]],
  [6.05, [0.2, 1.1, 5.2]],
  [6.6, [0.0, 1.25, 5.6]],
  [7.0, [0, 2.1, 8.4]],
  [8.0, [0, 2.5, 9.4]],
];

const CAM_TARGET: readonly VecKey[] = [
  [0.0, [-0.5, 2.6, -40]],
  [0.7, [-0.5, 2.3, -40]],
  [1.0, [-12, 3.6, -34]],
  [1.65, [-5.0, 1.8, -18]],
  [2.0, [-0.15, 1.17, 0]],
  [2.55, [0.0, 1.18, 0.3]],
  [3.0, [0, 1.2, 0.9]],
  [3.45, [0.15, 1.2, 0.9]],
  [3.85, [0.15, 1.2, 0.9], "linear"],
  [4.05, [0, 1.2, 0.6]],
  [4.75, [0, 1.2, 0.6]],
  [5.05, [0.2, 1.15, 0]],
  [5.75, [0.3, 1.15, 0]],
  [6.05, [0.2, 1.3, 0]],
  [6.6, [0.2, 1.35, 0]],
  [7.0, [-0.4, 2.7, -40]],
  [8.0, [-0.4, 3.1, -40]],
];

// ---- 肉 ----
const BLOCK_POS: readonly VecKey[] = [
  [1.55, [0.6, 6.5, 0]],
  [2.0, [0.6, 1.2, 0], "out"],
  [2.9, [0.6, 1.2, 0]],
  [3.15, [1.2, 1.15, -1.6]],
  [4.75, [1.2, 1.15, -1.6]],
  [5.0, [0.95, 1.2, 0]],
  [5.9, [0.95, 1.2, 0]],
  [6.1, [2.5, 1.1, -1.6]],
  [6.6, [2.5, 1.1, -1.6]],
  [7.0, [1.0, 6.5, 0], "in"],
];

const BLOCK_ROT: readonly VecKey[] = [
  [1.55, [0.25, 2.2, 0.15]],
  [2.0, [0.04, 1.05, 0.02], "out"],
  [2.4, [0.02, 0.95, 0]],
  [2.9, [0.02, 0.92, 0]],
  [3.15, [0, 0.6, 0]],
  [4.75, [0, 0.6, 0]],
  [5.0, [0.02, 1.0, 0]],
  [5.75, [0.02, 0.4, 0], "linear"],
  [6.1, [0.02, 0.55, 0]],
  [6.6, [0, 0.4, 0]],
  [7.0, [0.4, -1.2, 0.2], "in"],
];

const SLICE_SEPARATION: readonly NumKey[] = [[2.38, 0], [2.62, 1, "out"], [4.8, 1], [5.05, 0]];
const SLICE_PRESENT: readonly NumKey[] = [[2.55, 0], [3.0, 1], [4.78, 1], [5.02, 0]];

const PRESENT_POS_WIDE: readonly VecKey[] = [
  [2.9, [0.46, 1.2, 0.9]],
  [3.9, [0.46, 1.2, 0.9]],
  [4.1, [-0.95, 1.2, 1.0]],
  [4.75, [-0.95, 1.2, 1.0]],
];
const PRESENT_POS_TALL: readonly VecKey[] = [
  [2.9, [0, 1.2, 0.9]],
  [3.9, [0, 1.2, 0.9]],
  [4.1, [0, 1.78, 0.9]],
  [4.75, [0, 1.78, 0.9]],
];
/** 縦長の画面で海図を見せる間は、一枚を沈めずにカメラ側を持ち上げて文字の下に置く */
const TALL_CHART_LIFT: readonly NumKey[] = [[2.95, 0], [3.1, 0.42], [3.9, 0.42], [4.05, 0]];
const PRESENT_ROT: readonly VecKey[] = [
  [3.0, [0, 0, 0]],
  [3.9, [0, 0, 0]],
  [4.1, [0.08, 0.26, 0]],
  [4.75, [0.08, 0.26, 0]],
];

const FLASH: readonly NumKey[] = [[2.26, 0], [2.33, 1, "out"], [2.5, 0, "in"]];
const CHART: readonly NumKey[] = [[3.18, 0], [3.58, 1], [3.88, 1], [4.04, 0]];
const AGE: readonly NumKey[] = [[4.82, 1], [5.0, 0], [5.08, 0], [5.6, 1, "linear"]];
const PHASE_MIX: readonly NumKey[] = [[3.95, 0], [4.06, 1], [4.78, 1], [4.95, 0]];

// ---- 環境 ----
const OCEAN_AMP: readonly NumKey[] = [[0, 1], [1.0, 0.9], [1.9, 0.38], [6.6, 0.38], [7.0, 0.95]];
const STARS: readonly NumKey[] = [[0, 1], [1.7, 0.85], [2.0, 0.35], [6.6, 0.4], [7.0, 1]];
const CLOUDS: readonly NumKey[] = [[0, 0.42], [5.0, 0.42], [5.3, 0.75], [6.0, 0.45]];
const MIST: readonly NumKey[] = [[5.0, 0], [5.18, 1], [5.85, 1], [6.1, 0.35], [6.8, 0]];
const REFLECTION: readonly NumKey[] = [[1.6, 0], [2.0, 1], [6.7, 1], [7.0, 0]];
const KEY_LIGHT: readonly NumKey[] = [[1.6, 0.2], [2.0, 1], [5.9, 1], [6.1, 0.32], [6.7, 0.35], [7.0, 0.2]];
const RIM_LIGHT: readonly NumKey[] = [[0, 1], [6.0, 1], [6.1, 1.7], [6.7, 1.7], [7.0, 1]];
const EXPOSURE: readonly NumKey[] = [[0, 1], [1.95, 1], [2.05, 1.05], [3.3, 1.1], [3.9, 1.1], [4.1, 1.05], [6.0, 1], [7.0, 1]];
const BLOOM: readonly NumKey[] = [[0, 1.0], [2.0, 0.6], [6.8, 0.6], [7.0, 1.0]];
const VIGNETTE: readonly NumKey[] = [[0, 0.78], [3.3, 0.5], [3.9, 0.5], [4.1, 0.72]];
const MOON_ELEVATION: readonly NumKey[] = [[0, 0.115], [7.0, 0.115], [8.0, 0.19]];
const MOON_AZIMUTH = -0.12;
const MEAT_VISIBLE_FROM = 1.5;
const MEAT_VISIBLE_UNTIL = 7.02;
/** 断面を海図にして見せる間と、四つの部位を見せる間は塊を隠す */
const BLOCK_HIDDEN_FROM = 3.2;
const BLOCK_HIDDEN_UNTIL = 4.8;

export type DirectorInput = Readonly<{
  story: number;
  aspect: number;
  time: number;
  pointerX: number;
  pointerY: number;
  todayPhase: TidePhase;
  reducedMotion: boolean;
}>;

export type StageState = {
  cameraPosition: Vector3;
  cameraTarget: Vector3;
  fov: number;
  oceanAmp: number;
  stars: number;
  clouds: number;
  mist: number;
  reflection: number;
  moonElevation: number;
  moonAzimuth: number;
  keyLight: number;
  rimLight: number;
  keyDirection: Vector3;
  exposure: number;
  bloom: number;
  vignette: number;
  meat: MeatFrame;
};

/** ストーリー位置 S（と画面比・ポインタ）から、そのフレームの舞台の状態を決める純粋な写像 */
export class Director {
  private readonly blockVisual: MutableCutVisual = createMutableVisual(CUT_VISUALS.rising);
  private readonly sliceVisual: MutableCutVisual = createMutableVisual(CUT_VISUALS.rising);
  private readonly phaseVisual: MutableCutVisual = createMutableVisual(CUT_VISUALS.rising);
  private readonly tmp = new Vector3();
  private readonly state: StageState = {
    cameraPosition: new Vector3(),
    cameraTarget: new Vector3(),
    fov: 35,
    oceanAmp: 1,
    stars: 1,
    clouds: 0.55,
    mist: 0,
    reflection: 0,
    moonElevation: 0.115,
    moonAzimuth: MOON_AZIMUTH,
    keyLight: 0,
    rimLight: 1,
    keyDirection: new Vector3(),
    exposure: 1,
    bloom: 1,
    vignette: 0.75,
    meat: {
      visible: false,
      blockVisible: false,
      blockPosition: new Vector3(),
      blockRotation: new Vector3(),
      sliceSeparation: 0,
      slicePresent: 0,
      presentPosition: new Vector3(),
      presentRotation: new Vector3(),
      flash: 0,
      chart: 0,
      age: 1,
      blockVisual: this.blockVisual,
      sliceVisual: this.sliceVisual,
    },
  };

  evaluate(input: DirectorInput): StageState {
    const s = input.story;
    const st = this.state;
    const tall = input.aspect < 0.85;
    const motion = input.reducedMotion ? 0 : 1;

    evalVec(CAM_POS, s, st.cameraPosition);
    evalVec(CAM_TARGET, s, st.cameraTarget);
    this.fitToAspect(input.aspect);
    if (tall) {
      const lift = evalNum(TALL_CHART_LIFT, s);
      st.cameraPosition.y += lift;
      st.cameraTarget.y += lift;
    }

    const near = 1 - smoothstep(6, 12, st.cameraPosition.distanceTo(st.cameraTarget));
    const parallax = 0.16 * (1 - near * 0.6);
    st.cameraPosition.x += (input.pointerX * parallax + Math.sin(input.time * 0.23) * 0.04 * motion);
    st.cameraPosition.y += (input.pointerY * parallax * 0.55 + Math.sin(input.time * 0.35) * 0.025 * motion);
    st.fov = tall ? 50 : 35;

    st.oceanAmp = evalNum(OCEAN_AMP, s);
    st.stars = evalNum(STARS, s);
    st.clouds = evalNum(CLOUDS, s);
    st.mist = evalNum(MIST, s);
    st.reflection = evalNum(REFLECTION, s);
    st.moonElevation = evalNum(MOON_ELEVATION, s);
    st.keyLight = evalNum(KEY_LIGHT, s);
    st.rimLight = evalNum(RIM_LIGHT, s);
    st.exposure = evalNum(EXPOSURE, s);
    st.bloom = evalNum(BLOOM, s);
    st.vignette = evalNum(VIGNETTE, s);
    st.keyDirection
      .set(0.55 + input.pointerX * 0.75, 0.62 + input.pointerY * 0.45, 0.75)
      .normalize();

    this.evaluateMeat(input, tall, motion);
    return st;
  }

  /** 縦長の画面では、近景のときだけ被写体から引いて全体を収める */
  private fitToAspect(aspect: number): void {
    const st = this.state;
    const dist = st.cameraPosition.distanceTo(st.cameraTarget);
    const near = 1 - smoothstep(6, 12, dist);
    const pull = 1 + (Math.min(1.9, Math.max(1, 1 / aspect)) - 1) * 0.55 * near;
    this.tmp.subVectors(st.cameraPosition, st.cameraTarget).multiplyScalar(pull);
    st.cameraPosition.addVectors(st.cameraTarget, this.tmp);
  }

  private evaluateMeat(input: DirectorInput, tall: boolean, motion: number): void {
    const s = input.story;
    const meat = this.state.meat;
    meat.visible = s > MEAT_VISIBLE_FROM && s < MEAT_VISIBLE_UNTIL;
    meat.blockVisible = !(s > BLOCK_HIDDEN_FROM && s < BLOCK_HIDDEN_UNTIL);
    evalVec(BLOCK_POS, s, meat.blockPosition);
    evalVec(BLOCK_ROT, s, meat.blockRotation);
    meat.blockPosition.y += Math.sin(input.time * 0.6) * 0.02 * motion;
    meat.blockRotation.y += Math.sin(input.time * 0.17) * 0.05 * motion;

    meat.sliceSeparation = evalNum(SLICE_SEPARATION, s);
    meat.slicePresent = evalNum(SLICE_PRESENT, s);
    evalVec(tall ? PRESENT_POS_TALL : PRESENT_POS_WIDE, s, meat.presentPosition);
    evalVec(PRESENT_ROT, s, meat.presentRotation);
    const inPhases = smoothstep(PHASES_AT - 0.05, PHASES_AT + 0.1, s) * (1 - smoothstep(4.7, 4.85, s));
    meat.presentRotation.y += Math.sin(input.time * 0.4) * 0.1 * inPhases * motion;
    meat.presentPosition.y += Math.sin(input.time * 0.7) * 0.012 * motion;

    meat.flash = evalNum(FLASH, s) * motion;
    meat.chart = evalNum(CHART, s);
    meat.age = evalNum(AGE, s);

    const today = CUT_VISUALS[input.todayPhase];
    mixVisualInto(this.blockVisual, today, today, 0);

    const local = (s - PHASES_AT) / PHASE_STEP;
    const morph =
      smoothstep(0.88, 1.12, local) + smoothstep(1.88, 2.12, local) + smoothstep(2.88, 3.12, local);
    const from = Math.min(PHASE_ORDER.length - 1, Math.floor(morph));
    const to = Math.min(PHASE_ORDER.length - 1, from + 1);
    mixVisualInto(this.phaseVisual, CUT_VISUALS[PHASE_ORDER[from]], CUT_VISUALS[PHASE_ORDER[to]], morph - from);
    mixVisualInto(this.sliceVisual, today, this.phaseVisual, evalNum(PHASE_MIX, s));
  }
}
