/**
 * Circular author avatar. Renders the photo when present, else the author's
 * initials on a soft brand-blue disc. Fixed width/height (inline style) so it
 * never causes layout shift while the image loads.
 */
export function AuthorAvatar({
  name,
  src,
  size = 34,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "•";

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE8F3] font-semibold text-rebm-navy"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ? `${name} avatar` : ""}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
