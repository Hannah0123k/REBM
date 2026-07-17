import Link from "next/link";

/**
 * Dashboard placeholder. The posts list, search, filters and actions arrive in
 * Phase 2 — this is the Phase-1 landing so the protected shell is testable.
 */
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-[28px] font-bold text-rebm-navy">Dashboard</h1>
      <p className="mt-[8px] text-[15px] text-[rgb(30,41,59)]">
        Welcome to the Real Estate Broker Match CMS.
      </p>

      <div className="mt-[28px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/posts"
          className="rounded-[14px] border border-rebm-card-border bg-white p-[20px] transition-colors hover:border-rebm-blue"
        >
          <h2 className="text-[17px] font-semibold text-rebm-navy">Blog Posts</h2>
          <p className="mt-[6px] text-[14px] text-[rgb(90,100,110)]">
            Create, edit, schedule and publish posts.
          </p>
        </Link>

        <div className="rounded-[14px] border border-dashed border-rebm-card-border bg-white/60 p-[20px]">
          <h2 className="text-[17px] font-semibold text-[rgb(140,148,156)]">Media Library</h2>
          <p className="mt-[6px] text-[14px] text-[rgb(150,158,166)]">Coming soon.</p>
        </div>

        <div className="rounded-[14px] border border-dashed border-rebm-card-border bg-white/60 p-[20px]">
          <h2 className="text-[17px] font-semibold text-[rgb(140,148,156)]">Testimonials</h2>
          <p className="mt-[6px] text-[14px] text-[rgb(150,158,166)]">Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
