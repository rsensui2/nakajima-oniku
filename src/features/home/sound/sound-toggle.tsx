"use client";

import { useEffect, useRef, useState } from "react";
import { OceanSound } from "./ocean-sound";

const BARS = [0, 1, 2, 3];

export function SoundToggle() {
  const soundRef = useRef<OceanSound | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => soundRef.current?.dispose(), []);

  const toggle = async () => {
    soundRef.current ??= new OceanSound();
    try {
      if (on) {
        soundRef.current.stop();
        setOn(false);
      } else {
        await soundRef.current.start();
        setOn(true);
      }
    } catch (error) {
      console.error("Ocean sound failed:", error);
      setOn(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "潮騒を止める" : "潮騒を流す"}
      className="group flex items-center gap-2 rounded-full border border-moon/20 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] text-moon/75 transition-colors hover:border-moon/50 hover:text-moon"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {BARS.map((i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-current transition-[height] duration-300"
            style={{
              height: on ? undefined : "3px",
              animation: on ? `sound-bar 1.${4 + i}s ease-in-out ${i * 0.15}s infinite alternate` : undefined,
            }}
          />
        ))}
      </span>
      <span className="font-mincho tracking-[0.3em]">潮騒</span>
      <style>{`@keyframes sound-bar { from { height: 3px; } to { height: 12px; } }`}</style>
    </button>
  );
}
