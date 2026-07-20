import { Container } from "@/components/Container";

/** Skeleton while the blog index loads. */
export default function BlogLoading() {
  return (
    <main id="main-content" className="bg-white">
      <div className="min-h-[420px] w-full bg-rebm-blue/40" aria-hidden="true" />
      <Container className="pt-[56px] pb-[80px]">
        <div className="mx-auto max-w-[1400px] animate-pulse" aria-hidden="true">
          <div className="grid items-center gap-[52px] lg:grid-cols-[1.45fr_1fr]">
            <div className="aspect-[1564/942] w-full rounded-[22px] bg-[#EEF1F4]" />
            <div className="space-y-[14px]">
              <div className="h-[24px] w-[120px] rounded-full bg-[#EEF1F4]" />
              <div className="h-[40px] w-[90%] rounded bg-[#EEF1F4]" />
              <div className="h-[40px] w-[70%] rounded bg-[#EEF1F4]" />
            </div>
          </div>
          <div className="mt-[56px] grid grid-cols-1 gap-x-[40px] gap-y-[48px] sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[16/9] w-full rounded-[16px] bg-[#EEF1F4]" />
                <div className="mt-[18px] h-[24px] w-[85%] rounded bg-[#EEF1F4]" />
                <div className="mt-[10px] h-[16px] w-full rounded bg-[#F1F4F7]" />
              </div>
            ))}
          </div>
        </div>
      </Container>
      <span className="sr-only">Loading articles…</span>
    </main>
  );
}
