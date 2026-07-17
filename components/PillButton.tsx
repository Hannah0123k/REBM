import Link from "next/link";

/**
 * The pill button (Figma 131:5 hero, 95:50 mid-page, 131:8 testimonials).
 * All three are identical: 225×64, fill #032C40 @ 0.9, label Helvetica Neue
 * 24/32 white, text inset 32×16 → padding px-32 py-16.
 *
 * Radius: Figma's cornerRadius is 80, larger than half the height, so it renders
 * as a full pill. rounded-full is equivalent and won't drift if the height does.
 *
 * Figma defines no hover state (CLAUDE.md → Undesigned). The opacity shift is an
 * addition; it changes nothing about the static design.
 */
export function PillButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full bg-rebm-navy px-[32px] py-[16px] text-[24px] leading-[32px] whitespace-nowrap text-white transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  );
}
