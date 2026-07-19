import type { BlogPostType } from "@/content/blog-placeholders";

/**
 * Small category / post-type pill shown on a card. Market Watch is emphasized
 * (solid navy) so it reads as the distinct series it is on the live site;
 * articles use a lighter treatment.
 */
export function CategoryBadge({ label, type }: { label: string; type: BlogPostType }) {
  const tone =
    type === "market-watch"
      ? "bg-rebm-navy text-white"
      : "bg-white/90 text-rebm-navy ring-1 ring-rebm-navy/10";
  return (
    <span
      className={`inline-flex items-center rounded-full px-[12px] py-[5px] text-[12px] font-semibold tracking-[0.04em] uppercase ${tone}`}
    >
      {label}
    </span>
  );
}

/**
 * Placeholder thumbnail area — a soft brand-tinted panel with a landscape glyph
 * and a "Placeholder" caption, standing in for the future featured image. The
 * category badge sits over the top-left corner. `aspect` sets the image
 * proportions (grid ≈ 394×270, featured ≈ 668×473, from the Figma blog spec).
 */
export function ThumbPlaceholder({
  aspect,
  label,
  type,
  rounded = "rounded-[16px]",
}: {
  aspect: string;
  label: string;
  type: BlogPostType;
  rounded?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#DCE7F3] to-[#C3D6EA] ${aspect} ${rounded}`}
    >
      <div className="absolute top-[14px] left-[14px] z-10">
        <CategoryBadge label={label} type={type} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px] text-rebm-navy/40">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[34px]"
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
