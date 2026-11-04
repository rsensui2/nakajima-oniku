import { SECTION_HEIGHT_VH, type StorySection as SectionName } from "@/features/stage/story";

type Props = Readonly<{
  section: SectionName;
  id?: string;
  sticky?: boolean;
  className?: string;
  innerClassName?: string;
  label?: string;
  children: React.ReactNode;
}>;

/** ストーリー区間の外枠。sticky なら中身を 100svh で画面に貼り付ける。 */
export function StorySection({ section, id, sticky, className, innerClassName, label, children }: Props) {
  return (
    <section
      id={id}
      aria-label={label}
      data-story-section={section}
      style={{ height: `${SECTION_HEIGHT_VH[section]}vh` }}
      className={`relative ${className ?? ""}`}
    >
      {sticky ? (
        <div className={`sticky top-0 h-svh overflow-hidden ${innerClassName ?? ""}`}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
