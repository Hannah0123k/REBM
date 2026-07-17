/**
 * The site's single horizontal container. Every section's gutters come from
 * here — never hard-code a page gutter anywhere else.
 *
 * Derived by measuring the live site at four viewports (scripts/align-audit.mjs):
 *
 *   viewport   live container   live gutter
 *   1920       1547             187
 *   1512       1384              64
 *   1440       1312              64
 *   1280       1152              64
 *
 * That is exactly `width: min(1547px, 100% - 128px); margin-inline: auto`:
 *   1920 → min(1547, 1792) = 1547 → (1920-1547)/2 = 186.5 ✓
 *   1512 → min(1547, 1384) = 1384 → (1512-1384)/2 = 64    ✓
 *   1440 → 1312 → 64 ✓   ·   1280 → 1152 → 64 ✓
 *
 * i.e. the container caps at 1547 and centres on wide screens, and falls back to
 * a flat 64px gutter once the viewport drops below 1675 (1547 + 2×64).
 *
 * The build previously used a FIXED `px-[187px]` gutter, which happens to equal
 * the centred result at exactly 1920 and is wrong at every other width — at
 * 1440 it put every section 123px too far right. That is what "the whole site
 * is shifted right" was.
 */
export function Container({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "header" | "footer" | "section" | "nav";
}) {
  return (
    <Tag className={`mx-auto w-[min(1547px,100%-128px)] ${className}`}>{children}</Tag>
  );
}
