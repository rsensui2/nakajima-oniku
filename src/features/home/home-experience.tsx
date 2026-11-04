"use client";

import "lenis/dist/lenis.css";
import { useCallback, useMemo, useState } from "react";
import { useStoryScroll } from "./scroll/use-story-scroll";
import { StageCanvas } from "./stage-canvas";
import { ExperienceContext, type StageStatus } from "./state/experience-context";
import { createStoryBus } from "./state/story-bus";
import { StoryProvider } from "./state/story-context";
import { TideProvider } from "./state/tide-context";
import { Cursor } from "./ui/cursor";
import { HomeFooter } from "./ui/home-footer";
import { HomeHeader } from "./ui/home-header";
import { Loader } from "./ui/loader";

function ScrollDriver({ bus }: { bus: ReturnType<typeof createStoryBus> }) {
  useStoryScroll(bus);
  return null;
}

export function HomeExperience({ children }: { children: React.ReactNode }) {
  const bus = useMemo(() => createStoryBus(), []);
  const [stageStatus, setStageStatus] = useState<StageStatus>("loading");
  const [introDone, setIntroDone] = useState(false);

  const handleStatus = useCallback((status: StageStatus) => {
    setStageStatus((prev) => (prev === "fallback" ? prev : status));
  }, []);
  const handleIntroDone = useCallback(() => setIntroDone(true), []);
  const experience = useMemo(() => ({ stageStatus, introDone }), [stageStatus, introDone]);

  return (
    <ExperienceContext.Provider value={experience}>
      <TideProvider>
        <StoryProvider bus={bus}>
          <ScrollDriver bus={bus} />
          <div className="home-root relative min-h-svh text-moon">
            <StageCanvas onStatus={handleStatus} />
            <Loader onDone={handleIntroDone} />
            <HomeHeader />
            <main className={`relative z-10 ${introDone ? "is-intro-done" : ""}`}>{children}</main>
            <HomeFooter />
            <Cursor />
          </div>
        </StoryProvider>
      </TideProvider>
    </ExperienceContext.Provider>
  );
}
