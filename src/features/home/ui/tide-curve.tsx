"use client";

import { useMemo, useState } from "react";
import { CUTS } from "@/features/tide/cuts";
import { DAY_MS, formatJstTime } from "@/features/tide/jst";
import { tideLevelAt } from "@/features/tide/predict";
import { phaseAt, type TideSnapshot } from "@/features/tide/snapshot";
import { useInView } from "./in-view";
import { PHASE_COLOR } from "./phase-colors";

const W = 1000;
const H = 300;
const TOP = 34;
const CURVE_BOTTOM = 232;
const BAND_Y = 252;
const BAND_H = 20;
const LEVEL_MIN = -10;
const LEVEL_MAX = 220;
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

const yOf = (level: number) =>
  TOP + ((LEVEL_MAX - level) / (LEVEL_MAX - LEVEL_MIN)) * (CURVE_BOTTOM - TOP);

type Hover = Readonly<{ x: number; time: number; level: number }>;

/** 今日（JST）の潮位曲線。区間ごとの部位、満潮・干潮、現在時刻、なぞると任意時刻の値。 */
export function TideCurve({ snapshot }: { snapshot: TideSnapshot }) {
  const { day } = snapshot;
  const [svgRef, inView] = useInView<SVGSVGElement>(0.3);
  const [hover, setHover] = useState<Hover | null>(null);

  const xOf = (t: number) => ((t - day.start) / DAY_MS) * W;
  const path = useMemo(
    () =>
      day.curve
        .map((p, i) => `${i === 0 ? "M" : "L"}${(((p.time - day.start) / DAY_MS) * W).toFixed(1)} ${yOf(p.level).toFixed(1)}`)
        .join(" "),
    [day],
  );
  const area = `${path} L${W} ${CURVE_BOTTOM} L0 ${CURVE_BOTTOM} Z`;
  const nowX = xOf(snapshot.time);
  const nowY = yOf(snapshot.level);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = Math.min(W, Math.max(0, ((e.clientX - rect.left) / rect.width) * W));
    const time = day.start + (x / W) * DAY_MS;
    setHover({ x, time, level: tideLevelAt(time) });
  };

  const hoverPhase = hover ? phaseAt(hover.time, day.allExtremes) : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`h-auto w-full touch-none select-none ${inView ? "is-in" : ""}`}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`今日の東京湾の潮位曲線。${day.extremes
          .map((e) => `${e.type === "high" ? "満潮" : "干潮"} ${formatJstTime(e.time)} ${Math.round(e.level)}cm`)
          .join("、")}`}
        data-cursor
      >
        <defs>
          <linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5fb4c4" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#5fb4c4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {HOURS.map((h) => (
          <g key={h}>
            <line x1={(h / 24) * W} x2={(h / 24) * W} y1={TOP - 10} y2={CURVE_BOTTOM} stroke="rgba(243,234,215,0.08)" />
            <text x={(h / 24) * W} y={H - 4} fill="rgba(243,234,215,0.45)" fontSize="13" textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"} className="font-mono">
              {String(h).padStart(2, "0")}:00
            </text>
          </g>
        ))}
        {[0, 100, 200].map((lv) => (
          <g key={lv}>
            <line x1={0} x2={W} y1={yOf(lv)} y2={yOf(lv)} stroke="rgba(243,234,215,0.07)" strokeDasharray="2 6" />
            <text x={W - 2} y={yOf(lv) - 5} fill="rgba(243,234,215,0.35)" fontSize="11" textAnchor="end" className="font-mono">
              {lv}cm
            </text>
          </g>
        ))}

        <path d={area} fill="url(#tide-area)" className="transition-opacity duration-[1600ms]" style={{ opacity: inView ? 1 : 0 }} />
        <path
          d={path}
          fill="none"
          stroke="#f3ead7"
          strokeWidth={1.6}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={inView ? 0 : 1}
          style={{ transition: "stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1)" }}
        />

        {day.windows.map((w) => {
          const x1 = xOf(w.start);
          const x2 = xOf(w.end);
          const width = x2 - x1;
          return (
            <g key={`${w.start}-${w.phase}`} style={{ opacity: inView ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
              <rect x={x1 + 1} y={BAND_Y} width={Math.max(0, width - 2)} height={BAND_H} fill={PHASE_COLOR[w.phase]} fillOpacity={0.18} />
              <rect x={x1 + 1} y={BAND_Y} width={Math.max(0, width - 2)} height={2} fill={PHASE_COLOR[w.phase]} />
              {width > 70 && (
                <text x={x1 + width / 2} y={BAND_Y + 15} fill="rgba(243,234,215,0.85)" fontSize="12" textAnchor="middle">
                  {CUTS[w.phase].name}
                </text>
              )}
            </g>
          );
        })}

        {day.extremes.map((e, i) => {
          const x = xOf(e.time);
          const y = yOf(e.level);
          const high = e.type === "high";
          return (
            <g key={e.time} style={{ opacity: inView ? 1 : 0, transition: `opacity 0.8s ease ${1 + i * 0.15}s` }}>
              <circle cx={x} cy={y} r={3.5} fill={high ? "#f3ead7" : "#5fb4c4"} />
              <text
                x={x < 70 ? x - 4 : x > W - 70 ? x + 4 : x}
                y={high ? y - 12 : y + 22}
                fill="rgba(243,234,215,0.9)"
                fontSize="13"
                textAnchor={x < 70 ? "start" : x > W - 70 ? "end" : "middle"}
                className="font-mono"
              >
                {high ? "満" : "干"} {formatJstTime(e.time)} · {Math.round(e.level)}
              </text>
            </g>
          );
        })}

        <g style={{ opacity: inView ? 1 : 0, transition: "opacity 0.8s ease 1.6s" }}>
          <line x1={nowX} x2={nowX} y1={TOP - 14} y2={BAND_Y + BAND_H} stroke="#e8735a" strokeWidth={1} />
          <circle cx={nowX} cy={nowY} r={6} fill="#e8735a" className="live-dot" style={{ transformOrigin: `${nowX}px ${nowY}px` }} />
          <text x={nowX + 8} y={TOP - 4} fill="#e8735a" fontSize="12" className="font-mono">
            NOW {formatJstTime(snapshot.time)}
          </text>
        </g>

        {hover && (
          <g pointerEvents="none">
            <line x1={hover.x} x2={hover.x} y1={TOP - 10} y2={CURVE_BOTTOM} stroke="rgba(243,234,215,0.6)" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={yOf(hover.level)} r={4} fill="none" stroke="#f3ead7" />
          </g>
        )}
      </svg>

      <div className="mt-3 flex min-h-[1.5rem] flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.72rem] tracking-[0.12em] text-moon/70">
        {hover && hoverPhase ? (
          <>
            <span className="text-moon">{formatJstTime(hover.time)}</span>
            <span>潮位 {Math.round(hover.level)}cm</span>
            <span style={{ color: PHASE_COLOR[hoverPhase] }}>
              {CUTS[hoverPhase].phaseLabel} → {CUTS[hoverPhase].name}
            </span>
          </>
        ) : (
          <span className="text-moon/45">曲線をなぞると、その時刻の潮位と「切るならこの部位」が出ます</span>
        )}
      </div>
    </div>
  );
}
