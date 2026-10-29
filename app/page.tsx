import { Hero } from "@/components/hero";
import { Pieces } from "@/components/pieces";
import { DropFile } from "@/components/drop-file";
import { Details } from "@/components/details";
import { LookCloser } from "@/components/look-closer";
import { Footer } from "@/components/footer";
import { RevealObserver } from "@/components/reveal-observer";
import { homeSchema } from "@/lib/schema";

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema()).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Pieces />
      <DropFile />
      <Details />
      <LookCloser />
      <Footer />
      <RevealObserver />
    </main>
  );
}
