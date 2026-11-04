"use client";

import { createContext, useContext } from "react";

export type StageStatus = "loading" | "ready" | "fallback";

type ExperienceValue = Readonly<{
  stageStatus: StageStatus;
  introDone: boolean;
}>;

export const ExperienceContext = createContext<ExperienceValue>({
  stageStatus: "loading",
  introDone: false,
});

export const useExperience = (): ExperienceValue => useContext(ExperienceContext);
