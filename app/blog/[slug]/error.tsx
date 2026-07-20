"use client";

import Link from "next/link";

/** Error boundary for an article page (e.g. a transient data-store failure). */
export default function ArticleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="bg-white">
      <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-[24px] pt-[var(--header-h)] text-center">
        <h1 className="text-[28px] font-bold text-rebm-navy">Something went wrong</h1>
        <p className="mt-[10px] text-[15px] text-[rgb(90,102,114)]">
          We couldn’t load this article just now. Please try again.
        </p>
        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-rebm-navy px-[22px] py-[11px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/blog"
            className="rounded-full border border-rebm-card-border px-[22px] py-[11px] text-[15px] font-medium text-rebm-navy hover:bg-[#F0F2F4]"
          >
            Back to Our Blogs
          </Link>
        </div>
      </div>
    </main>
  );
}
