"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { autosavePost, createPost, updatePost } from "@/app/admin/posts/actions";
import { AUTHORS, findAuthorByName } from "@/lib/blog/authors";
import { isoToZonedInput, zonedInputToIso } from "@/lib/blog/date";
import { isEmptyDoc } from "@/lib/blog/readingTime";
import { slugify } from "@/lib/blog/slug";
import type { BlogPost, PostStatus, TiptapDoc } from "@/lib/blog/types";

const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };
const STATUSES: PostStatus[] = ["draft", "published", "scheduled", "unpublished"];
const AUTOSAVE_MS = 3000;

// datetime-local ⇄ UTC-instant conversion is anchored to the site's business
// display zone (America/New_York), NOT the admin's browser zone, so the date the
// admin picks is the date the public sees. See lib/blog/date.ts.
const isoToLocalInput = isoToZonedInput;
const localInputToIso = zonedInputToIso;

/** Mirror of the server's normalizeStatus so the UI reflects the saved value. */
function normalizeStatus(status: PostStatus, iso: string | null): PostStatus {
  if (!iso) return status;
  const future = new Date(iso) > new Date();
  if (status === "published" && future) return "scheduled";
  if (status === "scheduled" && !future) return "published";
  return status;
}

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function PostEditor({ post, initialTags = [] }: { post?: BlogPost; initialTags?: string[] }) {
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
  const [authorImageUrl, setAuthorImageUrl] = useState<string | null>(post?.author_image_url ?? null);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [publishedLocal, setPublishedLocal] = useState(isoToLocalInput(post?.published_at ?? null));
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [tags, setTags] = useState<string[]>(initialTags);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dirty = saveState === "unsaved" || saveState === "error";

  // Latest server version this editor is known to be in sync with.
  const updatedAtRef = useRef<string | undefined>(post?.updated_at);
  // Shared re-entrancy guard: only one mutation (manual OR autosave) at a time.
  const mutating = useRef(false);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  // Title change also derives the slug until the user edits the slug directly.
  const onTitleChange = useCallback(
    (v: string) => {
      setTitle(v);
      setSlug((prev) => (slugEdited ? prev : slugify(v)));
      clearFieldError("title");
    },
    [slugEdited, clearFieldError],
  );

  // Mark unsaved on any field change (after initial mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveState("unsaved");
  }, [title, slug, excerpt, body, featuredUrl, featuredAlt, author, authorImageUrl, status, featured, publishedLocal, seoTitle, metaDescription, tags]);

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
      author_image_url: authorImageUrl,
      status,
      featured,
      published_at: localInputToIso(publishedLocal),
      seo_title: seoTitle || null,
      meta_description: metaDescription || null,
      tags,
    }),
    [title, slug, excerpt, body, featuredUrl, featuredAlt, author, authorImageUrl, status, featured, publishedLocal, seoTitle, metaDescription, tags],
  );

  // Autosave (edit mode, content only). Debounced; single in-flight across
  // manual + auto; retries on transient error; never touches slug/status/dates.
  useEffect(() => {
    if (mode !== "edit" || !post) return;
    if (saveState !== "unsaved" && saveState !== "error") return;
    if (isEmptyDoc(body)) return;

    const t = setTimeout(async () => {
      if (mutating.current) return; // a manual save (or autosave) is running; a
      // later state transition will re-arm this effect.
      mutating.current = true;
      setSaveState("saving");
      const res = await autosavePost(post.id, { title, body, excerpt }, updatedAtRef.current);
      mutating.current = false;
      if (res.ok) {
        updatedAtRef.current = res.savedAt ?? updatedAtRef.current;
        setSaveState("saved");
      } else if (res.conflict) {
        setConflict(true);
        setSaveState("error");
        setFormError("This post was changed in another tab or by someone else. Reload before saving.");
      } else {
        setSaveState("error"); // re-arms via the effect (bounded to the debounce)
        setFormError(res.error ?? "Autosave failed — will retry.");
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [mode, post, saveState, body, title, excerpt]);

  async function save(nextStatus?: PostStatus) {
    if (mutating.current) return; // ignore double-clicks / concurrent triggers
    mutating.current = true;
    setFormError(null);
    setConflict(false);
    setFieldErrors({});
    setSaveState("saving");
    const effectiveStatus = nextStatus ?? status;
    if (nextStatus) setStatus(nextStatus);
    const input = { ...buildInput(), status: effectiveStatus };

    try {
      const res = post
        ? await updatePost(post.id, input, updatedAtRef.current)
        : await createPost(input);
      if (!res.ok) {
        setSaveState("error");
        setFormError(res.error);
        setConflict(Boolean(res.conflict));
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      updatedAtRef.current = res.updatedAt;
      // Reflect any server-side normalization (future-dated publish → scheduled).
      setStatus(normalizeStatus(effectiveStatus, localInputToIso(publishedLocal)));
      setSaveState("saved");
      // After a successful manual save, return to the posts dashboard.
      router.push("/admin/posts");
    } finally {
      mutating.current = false;
    }
  }

  const busy = saveState === "saving";

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
            disabled={busy}
            className="rounded-full border border-rebm-card-border px-[18px] py-[9px] text-[14px] font-medium text-rebm-navy hover:bg-[#F0F2F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => save()}
            disabled={busy}
            className="rounded-full bg-rebm-navy px-[20px] py-[9px] text-[14px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {formError && (
        <div role="alert" className="mt-[14px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
          {formError}
          {conflict && (
            <button onClick={() => router.refresh()} className="ml-[8px] font-semibold underline">
              Reload
            </button>
          )}
        </div>
      )}

      <div className="mt-[18px] grid gap-[24px] lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-[18px]">
          <Field label="Title" error={fieldErrors.title}>
            {(id) => (
              <input
                id={id}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Post title"
                className="w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[11px] text-[18px] font-semibold outline-none focus:border-rebm-blue"
              />
            )}
          </Field>

          <Field label="Slug" hint="Auto-filled from the title; edit to override." error={fieldErrors.slug}>
            {(id) => (
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] text-[rgb(140,148,156)]">/blog/</span>
                <input
                  id={id}
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value);
                    clearFieldError("slug");
                  }}
                  className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
                />
              </div>
            )}
          </Field>

          <Field label="Excerpt" hint="Short summary shown on the blog index.">
            {(id) => (
              <textarea
                id={id}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[10px] text-[15px] outline-none focus:border-rebm-blue"
              />
            )}
          </Field>

          <Field label="Body" error={fieldErrors.body}>
            <TiptapEditor value={body} onChange={setBody} />
          </Field>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-[18px]">
          <Panel title="Publishing">
            <Field label="Status">
              {(id) => (
                <select
                  id={id}
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
              )}
            </Field>
            {(status === "published" || status === "scheduled") && (
              <Field label="Publish date & time" hint="Eastern Time (ET) — the date shown publicly. Past dates allowed." error={fieldErrors.published_at}>
                {(id) => (
                  <input
                    id={id}
                    type="datetime-local"
                    value={publishedLocal}
                    onChange={(e) => {
                      setPublishedLocal(e.target.value);
                      clearFieldError("published_at");
                    }}
                    className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
                  />
                )}
              </Field>
            )}
            <label className="mt-[6px] flex items-center gap-[8px] text-[14px] text-rebm-navy">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured post
            </label>
          </Panel>

          <Panel title="Author">
            <Field label="Author">
              {(id) => {
                const registryAuthor = findAuthorByName(author);
                // Selected value: the registry id when the name maps to a known
                // author, otherwise the legacy free-text name (preserved), else "".
                const selectValue = registryAuthor ? registryAuthor.id : author || "";
                const isLegacy = !registryAuthor && author.length > 0;
                return (
                  <select
                    id={id}
                    value={selectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setAuthor("");
                        setAuthorImageUrl(null);
                        return;
                      }
                      const chosen = AUTHORS.find((a) => a.id === val);
                      if (chosen) {
                        setAuthor(chosen.name);
                        setAuthorImageUrl(chosen.imageUrl);
                      }
                      // A legacy value (unchanged existing name) leaves state as-is.
                    }}
                    className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] capitalize outline-none focus:border-rebm-blue"
                  >
                    <option value="">Select author…</option>
                    {isLegacy && (
                      <option value={author}>{author} (existing)</option>
                    )}
                    {AUTHORS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                );
              }}
            </Field>
          </Panel>

          <Panel title="Tags">
            <TagInput tags={tags} onChange={setTags} />
          </Panel>

          <Panel title="Featured image">
            <ImageUploadField
              url={featuredUrl}
              alt={featuredAlt}
              onChange={({ url, alt }) => {
                setFeaturedUrl(url);
                setFeaturedAlt(alt);
              }}
            />
          </Panel>

          <Panel title="SEO">
            <Field label="SEO title" error={fieldErrors.seo_title}>
              {(id) => (
                <>
                  <input
                    id={id}
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      clearFieldError("seo_title");
                    }}
                    className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
                  />
                  <Counter value={seoTitle.length} recommended={60} max={70} />
                </>
              )}
            </Field>
            <Field label="Meta description" error={fieldErrors.meta_description}>
              {(id) => (
                <>
                  <textarea
                    id={id}
                    value={metaDescription}
                    onChange={(e) => {
                      setMetaDescription(e.target.value);
                      clearFieldError("meta_description");
                    }}
                    rows={3}
                    className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
                  />
                  <Counter value={metaDescription.length} recommended={160} max={320} />
                </>
              )}
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
  return (
    <span role="status" aria-live="polite" className={`text-[13px] font-medium ${s.cls}`}>
      {s.text}
    </span>
  );
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

/** Comma/Enter-delimited tag chips. Emits clean, de-duplicated tag names. */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  function add(raw: string) {
    const name = raw.trim();
    if (!name) return;
    if (!tags.some((t) => t.toLowerCase() === name.toLowerCase())) onChange([...tags, name]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-[6px]">
          {tags.map((t) => (
            <li key={t} className="flex items-center gap-[6px] rounded-full bg-[#EEF3F8] px-[10px] py-[4px] text-[13px] text-rebm-navy">
              {t}
              <button
                type="button"
                aria-label={`Remove tag ${t}`}
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="text-[rgb(120,130,140)] hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={inputId} className="sr-only">
        Add a tag
      </label>
      <input
        id={inputId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder="Add a tag, press Enter"
        className="w-full rounded-[10px] border border-rebm-card-border px-[12px] py-[9px] text-[14px] outline-none focus:border-rebm-blue"
      />
    </div>
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
  children: ReactNode | ((id: string) => ReactNode);
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-[13px] font-medium text-rebm-navy">
        {label}
      </label>
      {typeof children === "function" ? children(id) : children}
      {hint && !error && <span className="text-[12px] text-[rgb(150,158,166)]">{hint}</span>}
      {error && (
        <span role="alert" className="text-[13px] text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-rebm-card-border bg-white p-[16px]">
      <h2 className="mb-[12px] text-[13px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">{title}</h2>
      <div className="flex flex-col gap-[12px]">{children}</div>
    </section>
  );
}
