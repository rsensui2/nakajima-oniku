"use client";

import Link from "next/link";
import { useRef } from "react";

const PULL = 0.28;

type Props = Readonly<{
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}>;

/** カーソルに少し吸い寄せられ、内側が潮のように満ちるボタン */
export function MagneticLink({ href, children, variant = "solid", className }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * PULL;
    const y = (e.clientY - rect.top - rect.height / 2) * PULL;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const base =
    "group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-bold tracking-[0.2em] transition-[transform,color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const look =
    variant === "solid"
      ? "bg-moon text-abyss hover:text-moon"
      : "border border-moon/30 text-moon hover:border-moon/70";

  return (
    <Link ref={ref} href={href} onPointerMove={onMove} onPointerLeave={onLeave} className={`${base} ${look} ${className ?? ""}`}>
      {variant === "solid" && (
        <span
          aria-hidden
          className="absolute inset-0 translate-y-full rounded-full bg-ember transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
        />
      )}
      <span className="relative">{children}</span>
      <span aria-hidden className="relative transition-transform duration-500 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
