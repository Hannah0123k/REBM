import { PhoneIcon } from "@/components/icons/PhoneIcon";
import { PHONE_HREF, PHONE_NUMBER } from "@/lib/nav";

/**
 * Phone pill in the header nav.
 * Live-site values (CLAUDE.md → the 2026-07-16 pivot): label Inter 16px/30px,
 * white, on the navy pill. Figma's 18px/29.333 is the older design.
 */
export function PhonePill({ className = "" }: { className?: string }) {
  return (
    <a
      href={PHONE_HREF}
      className={`flex shrink-0 items-center gap-[8px] rounded-full bg-rebm-navy px-[24px] py-[8px] whitespace-nowrap text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <PhoneIcon className="size-[21.333px] shrink-0" />
      <span className="text-[16px] leading-[30px]">{PHONE_NUMBER}</span>
    </a>
  );
}
