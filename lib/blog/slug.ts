/**
 * Slugify a title into the DB's required format: ^[a-z0-9]+(-[a-z0-9]+)*$
 * (lowercase, hyphen-separated, no leading/trailing/double hyphens).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, "") // trim hyphens
    .replace(/-{2,}/g, "-"); // collapse repeats
}

/** True if the string already matches the DB slug constraint. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
