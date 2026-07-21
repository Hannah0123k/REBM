/**
 * Canonical author registry for blog posts.
 *
 * The admin editor's Author dropdown is built from this list, and picking an
 * entry populates BOTH the post's `author_name` and `author_image_url` (a
 * bundled app asset under /public/assets/authors). Adding a future author is a
 * one-line addition here — no schema change, no effect on existing posts.
 */
export type Author = { id: string; name: string; imageUrl: string };

export const AUTHORS: Author[] = [
  { id: "alan-fruitman", name: "Alan Fruitman", imageUrl: "/assets/authors/alan-fruitman.jpg" },
  { id: "rhett-fruitman", name: "Rhett Fruitman", imageUrl: "/assets/authors/rhett-fruitman.jpg" },
];

/** Find a registry author by exact (trimmed, case-insensitive) name match. */
export function findAuthorByName(name: string | null | undefined): Author | undefined {
  if (!name) return undefined;
  const needle = name.trim().toLowerCase();
  return AUTHORS.find((a) => a.name.toLowerCase() === needle);
}

/**
 * Resolve the author image to render for a post, AUTHORITATIVELY from the name.
 *
 * The image is derived from `author_name` via the registry — so the two can
 * never drift apart, and it is impossible to show (say) Alan's photo next to
 * Rhett's name. This also self-heals every post that has a registry author name
 * but a null/stale `author_image_url` (all migrated posts, and any post whose
 * dropdown showed the right author but never re-fired onChange), with no data
 * migration. For a genuinely custom (non-registry) author we fall back to the
 * stored URL, then to null (AuthorAvatar then shows initials).
 */
export function resolveAuthorImage(
  name: string | null | undefined,
  storedUrl: string | null | undefined,
): string | null {
  return findAuthorByName(name)?.imageUrl ?? storedUrl ?? null;
}
