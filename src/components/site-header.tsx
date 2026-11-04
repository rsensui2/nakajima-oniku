import Link from "next/link";

const nav = [
  { href: "/#tide", label: "今日の潮" },
  { href: "/concept", label: "コンセプト" },
  { href: "/apply", label: "申込" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-sea/10 bg-sand/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-[0.65rem] font-semibold tracking-[0.25em] text-tide uppercase">
            Nakajima Tide Cut
          </span>
          <span className="text-lg font-bold tracking-tight text-sea group-hover:text-coral transition-colors">
            潮待熟成 中島
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white hover:text-sea transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
