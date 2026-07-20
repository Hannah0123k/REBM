"use client";

import { useState } from "react";

import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";

/**
 * Cover image with a graceful fallback — the only client leaf in the cards.
 * Renders the real image when a URL is present; on load error (or when no URL
 * exists) it falls back to the tinted placeholder, so a broken-image icon never
 * appears. Keeps the surrounding cards as server components.
 */
export function CoverImage({
  url,
  alt,
  aspect,
  tone = "light",
  rounded = "rounded-[16px]",
  eager = false,
}: {
  url: string | null;
  alt: string;
  aspect: string;
  tone?: "light" | "blue";
  rounded?: string;
  eager?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <ThumbPlaceholder aspect={aspect} tone={tone} rounded={rounded} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setBroken(true)}
      className={`${aspect} w-full ${rounded} object-cover`}
    />
  );
}
