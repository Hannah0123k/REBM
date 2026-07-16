import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Homepage. Sections get built one at a time against Figma node 95:2.
 * Right now this is a shell that mounts the shared header and footer so they
 * can be verified in a browser; the placeholder below stands in for the real
 * hero (Frame 6, 95:22) and gets replaced next.
 */
export default function Home() {
  return (
    <>
      <div className="relative">
        <SiteHeader />
        {/* PLACEHOLDER — the real hero is not built yet. Uses the frame fill so
            the header's white text renders against the right background. */}
        <section className="h-[900px] w-full bg-rebm-blue" />
      </div>
      <Footer />
    </>
  );
}
