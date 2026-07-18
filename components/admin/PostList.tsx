"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  archivePost,
  deletePost,
  duplicatePost,
  restorePost,
} from "@/app/admin/posts/actions";
import { displayStatus, type PostListItem } from "@/lib/blog/types";

type Filter = "All" | "Draft" | "Published" | "Scheduled" | "Unpublished" | "Archived";
const FILTERS: Filter[] = ["All", "Draft", "Published", "Scheduled", "Unpublished", "Archived"];

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function PostList({ initialPosts }: { initialPosts: PostListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PostListItem | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialPosts.filter((p) => {
      const label = displayStatus(p).label;
      if (filter === "Archived") {
        if (label !== "Archived") return false;
      } else if (filter === "All") {
        if (label === "Archived") return false; // "All" excludes archived
      } else if (label !== filter) {
        return false;
      }
      if (q && !`${p.title} ${p.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [initialPosts, query, filter]);

  const run = (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    startTransition(async () => {
      await fn();
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-[16px]">
        <h1 className="text-[28px] font-bold text-rebm-navy">Blog Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-rebm-navy px-[20px] py-[10px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
        >
          + Create Post
        </Link>
      </div>

      <div className="mt-[20px] flex flex-wrap items-center gap-[10px]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or slug…"
          className="w-[260px] rounded-[10px] border border-rebm-card-border bg-white px-[14px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
        />
        <div className="flex flex-wrap gap-[6px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-[12px] py-[6px] text-[13px] transition-colors ${
                filter === f ? "bg-rebm-navy text-white" : "bg-white text-rebm-navy hover:bg-[#F0F2F4]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[16px] overflow-hidden rounded-[14px] border border-rebm-card-border bg-white">
        {visible.length === 0 ? (
          <div className="p-[48px] text-center text-[15px] text-[rgb(120,130,140)]">
            {initialPosts.length === 0
              ? "No posts yet. Create your first post."
              : "No posts match this view."}
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rebm-card-border text-[12px] tracking-wide text-[rgb(120,130,140)] uppercase">
                <th className="px-[16px] py-[12px] font-semibold">Title</th>
                <th className="px-[12px] py-[12px] font-semibold">Status</th>
                <th className="px-[12px] py-[12px] font-semibold">Author</th>
                <th className="px-[12px] py-[12px] font-semibold">Published</th>
                <th className="px-[12px] py-[12px] font-semibold">Updated</th>
                <th className="px-[12px] py-[12px] font-semibold">Read</th>
                <th className="px-[16px] py-[12px] text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const busy = busyId === p.id && pending;
                const archived = !!p.archived_at;
                return (
                  <tr key={p.id} className="border-b border-[#F0F2F4] last:border-0 align-middle">
                    <td className="px-[16px] py-[12px]">
                      <Link href={`/admin/posts/${p.id}/edit`} className="font-medium text-rebm-navy hover:underline">
                        {p.title}
                      </Link>
                      {p.featured && (
                        <span className="ml-[8px] rounded-full bg-[#FBEFD6] px-[7px] py-[1px] text-[11px] font-medium text-[#8A5A00]">
                          Featured
                        </span>
                      )}
                      <div className="text-[12px] text-[rgb(150,158,166)]">/{p.slug}</div>
                    </td>
                    <td className="px-[12px] py-[12px]">
                      <StatusBadge status={p.status} published_at={p.published_at} archived_at={p.archived_at} />
                    </td>
                    <td className="px-[12px] py-[12px] text-[14px] text-[rgb(70,80,90)]">{p.author_name ?? "—"}</td>
                    <td className="px-[12px] py-[12px] text-[14px] text-[rgb(70,80,90)]">{fmt(p.published_at)}</td>
                    <td className="px-[12px] py-[12px] text-[14px] text-[rgb(70,80,90)]">{fmt(p.updated_at)}</td>
                    <td className="px-[12px] py-[12px] text-[14px] text-[rgb(70,80,90)]">
                      {p.reading_time_minutes} min
                    </td>
                    <td className="px-[16px] py-[12px]">
                      <div className="flex justify-end gap-[8px] text-[13px]">
                        <Link href={`/admin/posts/${p.id}/edit`} className="text-rebm-link hover:underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(p.id, () => duplicatePost(p.id))}
                          className="text-rebm-navy hover:underline disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        {archived ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(p.id, () => restorePost(p.id))}
                            className="text-[#1B7A43] hover:underline disabled:opacity-50"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(p.id, () => archivePost(p.id))}
                            className="text-[#8A5A00] hover:underline disabled:opacity-50"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDelete(p)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete permanently?"
          body={`“${confirmDelete.title}” will be permanently deleted. This can’t be undone — consider Archive instead. Type DELETE to confirm.`}
          confirmWord="DELETE"
          destructive
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const id = confirmDelete.id;
            setConfirmDelete(null);
            run(id, () => deletePost(id));
          }}
        />
      )}
    </div>
  );
}
