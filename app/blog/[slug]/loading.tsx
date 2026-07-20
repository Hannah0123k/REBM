import { Container } from "@/components/Container";

/** Skeleton while an article loads. */
export default function ArticleLoading() {
  return (
    <main id="main-content" className="bg-white">
      <Container className="pt-[calc(var(--header-h)+40px)] pb-[80px]">
        <div className="mx-auto max-w-[760px] animate-pulse" aria-hidden="true">
          <div className="h-[16px] w-[90px] rounded bg-[#EEF1F4]" />
          <div className="mt-[18px] h-[44px] w-[85%] rounded bg-[#EEF1F4]" />
          <div className="mt-[10px] h-[44px] w-[60%] rounded bg-[#EEF1F4]" />
          <div className="mt-[20px] h-[20px] w-[220px] rounded bg-[#EEF1F4]" />
          <div className="mt-[28px] aspect-[1564/942] w-full rounded-[20px] bg-[#EEF1F4]" />
          <div className="mt-[32px] space-y-[12px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[16px] rounded bg-[#F1F4F7]" style={{ width: `${90 - (i % 3) * 12}%` }} />
            ))}
          </div>
        </div>
      </Container>
      <span className="sr-only">Loading article…</span>
    </main>
  );
}
