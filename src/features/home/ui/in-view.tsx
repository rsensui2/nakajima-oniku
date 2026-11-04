"use client";

import { useEffect, useRef, useState } from "react";

/** 一度画面に入ったら true のまま（再生は一回きり） */
export function useInView<T extends Element>(threshold = 0.25, rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, inView]);
  return [ref, inView] as const;
}

type RevealProps = Readonly<{
  as?: "div" | "p" | "span" | "li";
  className?: string;
  delay?: number;
  children: React.ReactNode;
}>;

/** 画面に入ったら .is-in を付けるだけの入れ物 */
export function Reveal({ as = "div", className, delay = 0, children }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const Tag = as;
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${className ?? ""} ${inView ? "is-in" : ""}`}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
