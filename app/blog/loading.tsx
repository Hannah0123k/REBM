import { Container } from "@/components/Container";

/**
 * Instant loading UI for the blog route. The blog page reads Supabase (dynamic),
 * so during a client navigation the router would otherwise hold the previous
 * page on screen until data resolves — reading as a glitchy flash. This renders
 * immediately and mirrors the real blog layout EXACTLY (same hero height + "Our
 * Blogs" title, same content width, same card aspect/grid) so nothing jumps when
 * the real page swaps in — the screen only ever shows the blog page.
 */
export default function BlogLoading() {
  return (
    <main id="main-content" className="bg-white">
      <section className="relative flex min-h-[170px] w-full items-center justify-center overflow-hidden bg-rebm-blue pt-[40px] sm:min-h-[340px] sm:pt-[var(--header-h)] lg:min-h-[391px] lg:pt-[81px]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(104,158,207,0.22) 0%, rgba(104,158,207,0.30) 55%, rgba(104,158,207,0.38) 100%)",
          }}
        />
        <Container className="relative text-center">
          <h1 className="text-[40px] leading-[48px] font-bold tracking-[-0.2px] text-white [text-shadow:0_2px_5px_rgba(3,44,64,0.6),0_2px_20px_rgba(3,44,64,0.5)] sm:text-[52px] sm:leading-[62px] lg:text-[62px] lg:leading-[74px]">
            Our Blogs
          </h1>
        </Container>
      </section>

      <div className="mx-auto w-[min(1226px,100%-64px)] pt-[60px] pb-[80px] md:w-[min(1226px,100%-84px)] md:pt-[100px] lg:w-[min(1226px,100%-128px)]">
        <div className="animate-pulse" aria-hidden="true">
          {/* Featured skeleton (655 : 486 image/text split) */}
          <div className="grid items-center gap-[28px] lg:grid-cols-[655fr_486fr] lg:gap-[72px]">
            <div className="aspect-[1564/942] w-full rounded-[30px] bg-[#EEF1F4]" />
            <div className="space-y-[14px]">
              <div className="h-[16px] w-full rounded bg-[#EEF1F4]" />
              <div className="h-[16px] w-[88%] rounded bg-[#EEF1F4]" />
              <div className="mt-[8px] h-[13px] w-[38%] rounded bg-[#F1F4F7]" />
            </div>
          </div>

          {/* Grid skeleton — same 1564/942 cover, 3/2/1 cols, gap-x 48 / gap-y 70 */}
          <div className="mt-[40px] grid grid-cols-1 gap-x-[48px] gap-y-[70px] md:grid-cols-2 lg:mt-[60px] lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-[1564/942] w-full rounded-[16px] bg-[#EEF1F4]" />
                <div className="mt-[14px] h-[15px] w-full rounded bg-[#EEF1F4]" />
                <div className="mt-[8px] h-[15px] w-[80%] rounded bg-[#F1F4F7]" />
                <div className="mt-[14px] h-[13px] w-[35%] rounded bg-[#F1F4F7]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading articles…</span>
    </main>
  );
}
