import type { Metadata } from "next";
import { Story } from "@/components/story/story";
import { SITE } from "@/lib/site";

const DESC = "Not made to fit in. The story of Beyond Angels — the space between good intentions and bad influence, told down the length of one shirt.";

export const metadata: Metadata = {
  title: "Our Story",
  description: DESC,
  alternates: { canonical: "/our-story" },
  openGraph: { type: "article", url: "/our-story", title: "Our Story | Beyond Angels", description: DESC, images: [{ url: "/story/story-shirt.png", width: 760, height: 1198, alt: "Bad Influence — black T-shirt with embroidered chest mark" }] },
  twitter: { card: "summary_large_image", title: "Our Story | Beyond Angels", description: DESC, images: ["/story/story-shirt.png"] },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "AboutPage", "@id": `${SITE.url}/our-story#webpage`, url: `${SITE.url}/our-story`, name: "Our Story — Beyond Angels", description: DESC, isPartOf: { "@id": `${SITE.url}/#website` }, about: { "@id": `${SITE.url}/#organization` }, primaryImageOfPage: `${SITE.url}/story/story-shirt.png`, inLanguage: "en-IN" },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Our Story", item: `${SITE.url}/our-story` }] },
  ],
};

export default function OurStoryPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <Story />
    </>
  );
}
