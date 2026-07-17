import { PhoneIcon } from "@/components/icons/PhoneIcon";
import { PHONE_HREF, PHONE_NUMBER } from "@/lib/nav";

/**
 * Phone pill in the header nav. Measured from the live site:
 *   191×46, padding 8px 24px, radius 20px, gap 8px, icon 16px,
 *   label Inter 16px/30px white on the navy (rgba(3,44,64,0.9)) pill.
 */
export function PhonePill({ className = "" }: { className?: string }) {
  return (
    <a
      href={PHONE_HREF}
      className={`flex shrink-0 items-center gap-[8px] rounded-[20px] bg-rebm-navy px-[24px] py-[8px] whitespace-nowrap text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <PhoneIcon className="size-[16px] shrink-0" />
      <span className="text-[16px] leading-[30px]">{PHONE_NUMBER}</span>
    </a>
  );
}
