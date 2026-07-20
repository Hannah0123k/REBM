/** Skeleton shown while the posts list server-fetches. */
export default function PostsLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-[18px] h-[38px] w-[220px] rounded-[10px] bg-[#EEF1F4]" />
      <div className="flex flex-col gap-[10px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[64px] rounded-[12px] border border-rebm-card-border bg-[#F7F9FB]" />
        ))}
      </div>
      <span className="sr-only">Loading posts…</span>
    </div>
  );
}
