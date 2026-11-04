import { Reveal } from "../ui/in-view";
import { SectionLabel } from "../ui/section-label";
import { SplitText } from "../ui/split-text";
import { StorySection } from "../ui/story-section";

const FACTS = [
  { k: "出身", v: "千葉県", note: "海側で育った舌" },
  { k: "担当", v: "仕入れ・熟成・一枚切り", note: "一人の職人が通しで" },
  { k: "提案", v: "申込ごとに一枚", note: "人数・調理法・潮で決める" },
] as const;

export function Craftsman() {
  return (
    <StorySection section="craftsman" label="中島が切る">
      <div className="scrim-fade pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-abyss/60 to-abyss/30" />
      <div className="relative mx-auto flex h-full max-w-[1500px] flex-col justify-center px-5 pt-24 sm:px-10">
        <Reveal>
          <SectionLabel index="06" ja="中島が切る" en="THE BUTCHER" />
          <blockquote className="mt-10 max-w-5xl text-balance font-mincho text-[clamp(1.6rem,3.3vw,3.1rem)] font-medium leading-[1.6] tracking-[0.08em] text-moon [text-shadow:0_0_40px_rgba(4,7,10,0.8)]">
            <SplitText text="千葉の海側で育った舌で、" />
            <br />
            <SplitText text="湾のリズムに合わせた肉だけを切る。" offset={12} />
          </blockquote>
          <p className="rise mt-6 font-mincho text-lg tracking-[0.4em] text-moon/70" style={{ "--d": "900ms" } as React.CSSProperties}>
            ── 中島
          </p>
        </Reveal>
        <Reveal className="mt-16 grid gap-8 border-t border-moon/10 pt-10 sm:grid-cols-3" delay={200}>
          {FACTS.map((f, i) => (
            <div key={f.k} className="rise" style={{ "--d": `${300 + i * 120}ms` } as React.CSSProperties}>
              <p className="font-mono text-[0.64rem] tracking-[0.26em] text-moon/60">{f.k}</p>
              <p className="mt-2 font-mincho text-xl tracking-[0.12em] text-moon">{f.v}</p>
              <p className="mt-1 text-[0.82rem] text-moon/55">{f.note}</p>
            </div>
          ))}
        </Reveal>
        <Reveal className="rise mt-10 max-w-2xl text-[0.92rem] leading-[2.1] text-moon/70" delay={400}>
          匿名のブランドではなく、顔と名前で一枚を担保します。仕入れから熟成、切り出しまでを一人が担うので、「なぜ今日この部位なのか」を必ず言葉で添えられます。
        </Reveal>
      </div>
    </StorySection>
  );
}
