import { HomeExperience } from "@/features/home/home-experience";
import { Aging } from "@/features/home/sections/aging";
import { ChartScene } from "@/features/home/sections/chart-scene";
import { Craftsman } from "@/features/home/sections/craftsman";
import { CutScene } from "@/features/home/sections/cut-scene";
import { Hero } from "@/features/home/sections/hero";
import { LiveMarquee } from "@/features/home/sections/live-marquee";
import { Phases } from "@/features/home/sections/phases";
import { Reserve } from "@/features/home/sections/reserve";
import { TidePanel } from "@/features/home/sections/tide-panel";

export default function Home() {
  return (
    <HomeExperience>
      <Hero />
      <LiveMarquee />
      <TidePanel />
      <CutScene />
      <ChartScene />
      <Phases />
      <Aging />
      <Craftsman />
      <Reserve />
    </HomeExperience>
  );
}
