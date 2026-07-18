import Link from "next/link";

/**
 * The pill button (Figma 131:5 hero, 95:50 mid-page, 131:8 testimonials).
 * All three are identical: 225×64, fill #032C40 @ 0.9, label Helvetica Neue
 * 24/32 white, text inset 32×16 → padding px-32 py-16.
 *
 * Radius: Figma's cornerRadius is 80, larger than half the height, so it renders
 * as a full pill. rounded-full is equivalent and won't drift if the height does.
 *
 * Figma defines no hover state (CLAUDE.md → Undesigned). The interaction below
 * is an addition and changes nothing about the static design: on hover the CTA
 * grows slightly (scale 1.03) with a soft shadow, presses in on click (0.98),
 * shows a keyboard focus ring, and does none of this under prefers-reduced-motion.
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
      className={`inline-flex items-center rounded-full bg-rebm-navy px-[32px] py-[16px] text-[22px] leading-[32px] whitespace-nowrap text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      {children}
    </Link>
  );
}
