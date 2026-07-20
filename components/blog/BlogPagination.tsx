import Link from "next/link";

/**
 * Prev / page-of / next controls. Preserves the active search query across
 * pages. Renders nothing for a single page.
 */
export function BlogPagination({
  page,
  totalPages,
  basePath = "/blog",
  query,
}: {
  page: number;
  totalPages: number;
  basePath?: string;
  query?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pill =
    "inline-flex items-center rounded-full px-[22px] py-[11px] text-[15px] font-semibold transition-colors";

  return (
    <nav aria-label="Blog pagination" className="mt-[64px] flex items-center justify-center gap-[14px]">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${pill} bg-rebm-blue text-white hover:opacity-90`}>
          ← Newer
        </Link>
      ) : (
        <span className={`${pill} cursor-not-allowed bg-[#E7EDF3] text-[rgb(150,160,170)]`} aria-disabled="true">
          ← Newer
        </span>
      )}

      <span className="text-[14px] text-[rgb(90,102,114)]" aria-current="page">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${pill} bg-rebm-blue text-white hover:opacity-90`}>
          Older →
        </Link>
      ) : (
        <span className={`${pill} cursor-not-allowed bg-[#E7EDF3] text-[rgb(150,160,170)]`} aria-disabled="true">
          Older →
        </span>
      )}
    </nav>
  );
}
