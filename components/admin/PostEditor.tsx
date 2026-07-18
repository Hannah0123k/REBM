"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { autosavePost, createPost, updatePost } from "@/app/admin/posts/actions";
import { isEmptyDoc } from "@/lib/blog/readingTime";
import { slugify } from "@/lib/blog/slug";
import type { BlogPost, PostStatus, TiptapDoc } from "@/lib/blog/types";

const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };
const STATUSES: PostStatus[] = ["draft", "published", "scheduled", "unpublished"];

/** ISO → value for <input type="datetime-local"> (local time). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function PostEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const mode = post ? "edit" : "new";

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState<TiptapDoc>(post?.body ?? EMPTY_DOC);
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(post?.featured_image_url ?? null);
  const [featuredAlt, setFeaturedAlt] = useState(post?.featured_image_alt ?? "");
  const [author, setAuthor] = useState(post?.author_name ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [publishedLocal, setPublishedLocal] = useState(isoToLocalInput(post?.published_at ?? null));
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dirty = saveState === "unsaved" || saveState === "error";

  // Auto-generate slug from the title until the user edits the slug directly.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  // Mark unsaved on any field change (after initial mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveState("unsaved");
  }, [title, slug, excerpt, body, featuredUrl, featuredAlt, author, status, featured, publishedLocal, seoTitle, metaDescription]);

  // Warn before leaving the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const buildInput = useCallback(
    () => ({
      title,
      slug,
      excerpt,
      body,
      featured_image_url: featuredUrl,
      featured_image_alt: featuredAlt || null,
      author_name: author || null,
      status,
      featured,
      published_at: localInputToIso(publishedLocal),
      seo_title: seoTitle || null,
      meta_description: metaDescription || null,
    }),
    [title, slug, excerpt, body, featuredUrl, featuredAlt, author, status, featured, publishedLocal, seoTitle, metaDescription],
  );

  // Autosave (edit mode only, non-empty body). Debounced; single in-flight.
  const saving = useRef(false);
  useEffect(() => {
    if (mode !== "edit" || !post || saveState !== "unsaved") return;
    if (isEmptyDoc(body)) return;
    const t = setTimeout(async () => {
      if (saving.current) return;
      saving.current = true;
      setSaveState("saving");
      const res = await autosavePost(post.id, { title, slug, body, excerpt });
      saving.current = false;
      setSaveState(res.ok ? "saved" : "error");
      if (!res.ok) setFormError(res.error ?? "Autosave failed.");
    }, 20000);
    return () => clearTimeout(t);
  }, [mode, post, saveState, body, title, slug, excerpt]);

  async function save(nextStatus?: PostStatus) {
    setFormError(null);
    setFieldErrors({});
    setSaveState("saving");
    const input = { ...buildInput(), status: nextStatus ?? status };
    if (nextStatus) setStatus(nextStatus);

    const res = post ? await updatePost(post.id, input) : await createPost(input);
    if (!res.ok) {
      setSaveState("error");
      setFormError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setSaveState("saved");
    if (mode === "new") router.replace(`/admin/posts/${res.id}/edit`);
    else router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <button onClick={() => router.push("/admin/posts")} className="text-[14px] text-rebm-navy hover:underline">
            ← Posts
          </button>
          <SaveIndicator state={saveState} />
        </div>
        <div className="flex gap-[10px]">
          <button
            onClick={() => save("draft")}
            className="rounded-full border border-rebm-card-border px-[18px] py-[9px] text-[14px] font-medium text-rebm-navy hover:bg-[#F0F2F4]"
          >
            Save Draft
          </button>
          <button
            onClick={() => save()}
            className="rounded-full bg-rebm-navy px-[20px] py-[9px] text-[14px] font-medium text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>

      {formError && (
        <p role="alert" className="mt-[14px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
          {formError}
        </p>
      )}

      <div className="mt-[18px] grid gap-[24px] lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-[18px]">
          <Field label="Title" error={fieldErrors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[11px] text-[18px] font-semibold outline-none focus:border-rebm-blue"
            />
          </Field>

          <Field label="Slug" hint="Auto-filled from the title; edit to override." error={fieldErrors.slug}>
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px] text-[rgb(140,148,156)]">/blog/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value);
                }}
                className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
              />
            </div>
          </Field>

          <Field label="Excerpt" hint="Short summary shown on the blog index.">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[10px] text-[15px] outline-none focus:border-rebm-blue"
            />
          </Field>

          <Field label="Body" error={fieldErrors.body}>
            <TiptapEditor value={body} onChange={setBody} />
          </Field>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-[18px]">
          <Panel title="Publishing">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] capitalize outline-none focus:border-rebm-blue"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            {(status === "published" || status === "scheduled") && (
              <Field label="Publish date & time" hint="Past dates are allowed (for migrated posts)." error={fieldErrors.published_at}>
                <input
                  type="datetime-local"
                  value={publishedLocal}
                  onChange={(e) => setPublishedLocal(e.target.value)}
                  className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
                />
              </Field>
            )}
            <label className="mt-[6px] flex items-center gap-[8px] text-[14px] text-rebm-navy">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured post
            </label>
          </Panel>

          <Panel title="Author">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
            />
          </Panel>

          <Panel title="Featured image">
            <ImageUploadField
              url={featuredUrl}
              alt={featuredAlt}
              altError={fieldErrors.featured_image_alt}
              onChange={({ url, alt }) => {
                setFeaturedUrl(url);
                setFeaturedAlt(alt);
              }}
            />
          </Panel>

          <Panel title="SEO">
            <Field label="SEO title" error={fieldErrors.seo_title}>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
              />
              <Counter value={seoTitle.length} recommended={60} max={70} />
            </Field>
            <Field label="Meta description" error={fieldErrors.meta_description}>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
              />
              <Counter value={metaDescription.length} recommended={160} max={320} />
            </Field>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { text: string; cls: string }> = {
    idle: { text: "", cls: "" },
    unsaved: { text: "Unsaved changes", cls: "text-[#8A5A00]" },
    saving: { text: "Saving…", cls: "text-[rgb(120,130,140)]" },
    saved: { text: "Saved", cls: "text-[#1B7A43]" },
    error: { text: "Save failed", cls: "text-red-600" },
  };
  const s = map[state];
  return s.text ? <span className={`text-[13px] font-medium ${s.cls}`}>{s.text}</span> : null;
}

function Counter({ value, recommended, max }: { value: number; recommended: number; max: number }) {
  const over = value > recommended;
  return (
    <span className={`mt-[4px] block text-right text-[12px] ${over ? "text-[#8A5A00]" : "text-[rgb(150,158,166)]"}`}>
      {value} / {recommended}
      {value > max && <span className="text-red-600"> · exceeds {max} max</span>}
    </span>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[13px] font-medium text-rebm-navy">{label}</label>
      {children}
      {hint && !error && <span className="text-[12px] text-[rgb(150,158,166)]">{hint}</span>}
      {error && <span className="text-[13px] text-red-600">{error}</span>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-rebm-card-border bg-white p-[16px]">
      <h2 className="mb-[12px] text-[13px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">{title}</h2>
      <div className="flex flex-col gap-[12px]">{children}</div>
    </section>
  );
}
