import { displayStatus } from "@/lib/blog/types";
import type { PostStatus } from "@/lib/blog/types";

const TONES: Record<string, string> = {
  gray: "bg-[#EEF1F4] text-[rgb(90,100,110)]",
  green: "bg-[#E4F4EA] text-[#1B7A43]",
  amber: "bg-[#FBEFD6] text-[#8A5A00]",
  slate: "bg-[#E7EBEF] text-[#41505E]",
  red: "bg-[#FBE6E6] text-[#A5251F]",
};

export function StatusBadge({
  status,
  published_at,
  archived_at,
}: {
  status: PostStatus;
  published_at: string | null;
  archived_at: string | null;
}) {
  const { label, tone } = displayStatus({ status, published_at, archived_at });
  return (
    <span className={`inline-block rounded-full px-[10px] py-[3px] text-[12px] font-medium ${TONES[tone]}`}>
      {label}
    </span>
  );
}
