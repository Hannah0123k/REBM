/**
 * Blog search — a plain GET form (works without JS, fully accessible). Submits
 * to /blog?q=… which the index resolves against title/excerpt.
 */
export function BlogSearch({ q }: { q?: string }) {
  return (
    <form action="/blog" method="get" role="search" className="mx-auto mb-[40px] flex max-w-[520px] gap-[8px]">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search articles"
        aria-label="Search articles"
        className="w-full rounded-full border border-rebm-card-border px-[18px] py-[11px] text-[15px] outline-none focus:border-rebm-blue"
      />
      <button
        type="submit"
        className="rounded-full bg-rebm-navy px-[22px] py-[11px] text-[15px] font-medium text-white hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
