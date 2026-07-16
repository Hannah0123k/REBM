import { PhoneIcon } from "@/components/icons/PhoneIcon";
import { PHONE_HREF, PHONE_NUMBER } from "@/lib/nav";

/**
 * Phone pill from the header nav (Figma node 95:18).
 * Exact values read via get_design_context:
 *   fill rgba(3,44,64,0.9) · px-24 py-8 · radius 20 · gap 8 · icon 21.333
 *   label 18px / 29.333px line-height, white
 *
 * Figma renders this as a static div. It's a phone number on a lead-gen site,
 * so it's an anchor here — the design shows no hover state, so the opacity
 * shift is an addition (CLAUDE.md: hover states are undesigned).
 */
export function PhonePill({ className = "" }: { className?: string }) {
  return (
    <a
      href={PHONE_HREF}
      className={`flex shrink-0 items-center gap-[8px] rounded-[20px] bg-rebm-navy px-[24px] py-[8px] whitespace-nowrap text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <PhoneIcon className="size-[21.333px] shrink-0" />
      <span className="text-[18px] leading-[29.333px]">{PHONE_NUMBER}</span>
    </a>
  );
}
