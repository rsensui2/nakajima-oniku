import { BloomEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { HalfFloatType, type PerspectiveCamera, type Scene, type WebGLRenderer } from "three";
import type { Quality } from "../quality";
import { FinalEffect } from "./final-effect";

export type PostChain = Readonly<{
  composer: EffectComposer;
  bloom: BloomEffect;
  final: FinalEffect;
}>;

export function createPostChain(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  quality: Quality,
): PostChain {
  const composer = new EffectComposer(renderer, {
    frameBufferType: HalfFloatType,
    multisampling: quality.multisampling,
  });
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new BloomEffect({
    mipmapBlur: true,
    luminanceThreshold: 1.15,
    luminanceSmoothing: 0.35,
    intensity: 0.9,
    radius: 0.78,
    levels: quality.tier === "low" ? 5 : 7,
  });
  composer.addPass(new EffectPass(camera, bloom));

  const final = new FinalEffect();
  composer.addPass(new EffectPass(camera, final));
  return { composer, bloom, final };
}
