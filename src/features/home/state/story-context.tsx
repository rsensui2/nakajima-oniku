"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { StoryBus, StoryListener } from "./story-bus";

const StoryContext = createContext<StoryBus | null>(null);

export function StoryProvider({ bus, children }: { bus: StoryBus; children: React.ReactNode }) {
  return <StoryContext.Provider value={bus}>{children}</StoryContext.Provider>;
}

export function useStoryBus(): StoryBus {
  const bus = useContext(StoryContext);
  if (!bus) throw new Error("useStoryBus must be used inside <StoryProvider>");
  return bus;
}

/** S が変わるたびに呼ばれる（再描画しない）。DOM のスタイルを直接更新する用途。 */
export function useStoryFrame(listener: StoryListener): void {
  const bus = useStoryBus();
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  useEffect(() => bus.subscribe((s) => ref.current(s)), [bus]);
}

/** S から導いた離散的な値。値が変わったときだけ再描画する。 */
export function useStoryValue<T>(select: (story: number) => T): T {
  const bus = useStoryBus();
  const selectRef = useRef(select);
  const [value, setValue] = useState<T>(() => select(bus.get()));
  useEffect(() => {
    selectRef.current = select;
  });
  useEffect(
    () =>
      bus.subscribe((s) => {
        const next = selectRef.current(s);
        setValue((prev) => (Object.is(prev, next) ? prev : next));
      }),
    [bus],
  );
  return value;
}
