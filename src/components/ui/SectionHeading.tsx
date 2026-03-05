interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start";

  return (
    <div className={`flex max-w-3xl flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)] shadow-[var(--shadow-soft)]">
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-3">
        <Tag className="font-display text-4xl leading-none text-[var(--ink-strong)] md:text-5xl">
          {title}
        </Tag>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
