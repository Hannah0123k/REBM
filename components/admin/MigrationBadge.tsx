/** Per-post migration flags surfaced in the admin list (from blog_post_imports). */
export type MigrationFlags = {
  review_required: boolean;
  missing_featured_image: boolean;
  unresolved_image_count: number;
  metadata_incomplete: boolean;
};

const chip = "inline-flex items-center rounded-full px-[8px] py-[2px] text-[11px] font-semibold";

/** Concise badges — only rendered for imported posts, kept minimal. */
export function MigrationBadge({ flags }: { flags: MigrationFlags }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-[4px]" aria-label="Migration status">
      <span className={`${chip} bg-[#EDE9FE] text-[#5B21B6]`} title="Imported from the old site">
        Imported
      </span>
      {flags.review_required && (
        <span className={`${chip} bg-[#FEF3C7] text-[#92400E]`}>Review</span>
      )}
      {flags.missing_featured_image && (
        <span className={`${chip} bg-[#FEE2E2] text-[#991B1B]`} title="No featured image">
          No cover
        </span>
      )}
      {flags.unresolved_image_count > 0 && (
        <span className={`${chip} bg-[#FEE2E2] text-[#991B1B]`} title="Inline images pending replacement">
          {flags.unresolved_image_count} img
        </span>
      )}
      {flags.metadata_incomplete && (
        <span className={`${chip} bg-[#E0E7FF] text-[#3730A3]`} title="SEO / author needs review">
          SEO
        </span>
      )}
    </span>
  );
}
