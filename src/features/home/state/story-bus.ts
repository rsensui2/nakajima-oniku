export type StoryListener = (story: number) => void;

export type StoryBus = Readonly<{
  get: () => number;
  set: (story: number) => void;
  subscribe: (listener: StoryListener) => () => void;
}>;

/**
 * スクロール位置から求めたストーリー位置 S を毎フレーム配る小さな pub/sub。
 * React の再描画を介さずに DOM と WebGL を同じ S で同期させる。
 */
export function createStoryBus(): StoryBus {
  let story = 0;
  const listeners = new Set<StoryListener>();
  return {
    get: () => story,
    set: (next) => {
      if (next === story) return;
      story = next;
      listeners.forEach((listener) => listener(story));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(story);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
