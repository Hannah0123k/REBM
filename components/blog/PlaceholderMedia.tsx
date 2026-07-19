/**
 * Placeholder cover/thumbnail area standing in for a future post image.
 * `tone="blue"` is a solid brand-blue panel (used for the featured Market
 * Pulse-style cover); `tone="light"` is a soft tinted panel for article thumbs.
 * Replace with real <Image> covers during migration.
 */
export function ThumbPlaceholder({
  aspect,
  rounded = "rounded-[20px]",
  tone = "light",
}: {
  aspect: string;
  rounded?: string;
  tone?: "light" | "blue";
}) {
  const bg = tone === "blue" ? "bg-rebm-blue" : "bg-gradient-to-br from-[#DCE7F3] to-[#C3D6EA]";
  const fg = tone === "blue" ? "text-white/75" : "text-rebm-navy/40";
  return (
    <div className={`relative w-full overflow-hidden ${bg} ${aspect} ${rounded}`}>
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-[8px] ${fg}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[36px]"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-4.5-4.5L5 21" />
        </svg>
        <span className="text-[12px] font-medium tracking-[0.06em] uppercase">Placeholder</span>
      </div>
    </div>
  );
}
