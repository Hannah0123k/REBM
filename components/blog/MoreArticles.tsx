import Link from "next/link";

/**
 * "More Articles" control beneath the article grid. A wide pill in the site's
 * design system with the approved restrained hover scale (1.03), press (0.98),
 * focus ring, and motion-reduce fallback. When `href` is set it navigates to the
 * next page; otherwise it's a clearly-labeled disabled placeholder that does not
 * imply content loaded.
 */
const BASE =
  "inline-flex min-w-[220px] items-center justify-center gap-[8px] rounded-full px-[40px] py-[15px] text-[16px] font-semibold transition-[transform,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none";

export function MoreArticles({ href }: { href?: string }) {
  if (!href) {
    return (
      <span
        className={`${BASE} cursor-not-allowed bg-[#E7EDF3] text-[rgb(140,152,164)]`}
        aria-disabled="true"
        title="Available after migration"
      >
        More Articles
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${BASE} bg-rebm-navy text-white shadow-sm hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]`}
    >
      More Articles
      <span aria-hidden="true">→</span>
    </Link>
  );
}
