import { PIECES, SIZES } from "./pieces";
import { SITE } from "./site";

const abs = (path: string) => `${SITE.url}${path}`;

/** Schema.org graph for the homepage: Organization, WebSite, WebPage, and the drop as an ItemList of Products. */
export function homeSchema() {
  const orgId = `${SITE.url}/#organization`;
  const siteId = `${SITE.url}/#website`;
  const pageId = `${SITE.url}/#webpage`;
  const listId = `${SITE.url}/#drop-01`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE.name,
        url: SITE.url,
        logo: abs(PIECES[0].img.src),
        slogan: "Good intentions. Bad influence.",
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en-IN",
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: SITE.url,
        name: `${SITE.name} — Drop 01`,
        isPartOf: { "@id": siteId },
        about: { "@id": orgId },
        primaryImageOfPage: abs(PIECES[0].img.src),
        mainEntity: { "@id": listId },
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }],
      },
      {
        "@type": "ItemList",
        "@id": listId,
        name: "Drop 01",
        numberOfItems: PIECES.length,
        itemListElement: PIECES.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            "@id": `${SITE.url}/#${p.id}`,
            name: p.name,
            sku: p.code.replace(/—/g, "-"),
            description: `${p.colour} ${p.type.toLowerCase()} — ${p.tech.toLowerCase()}. ${p.copy}`,
            image: [p.img, p.photo, p.back].filter(Boolean).map((im) => abs(im!.src)),
            brand: { "@type": "Brand", name: SITE.name },
            color: p.colour,
            material: "240 GSM heavyweight cotton jersey",
            size: SIZES.filter((s) => !p.out.includes(s)),
            category: p.type,
            offers: {
              "@type": "Offer",
              url: `${SITE.url}/#pieces`,
              priceCurrency: SITE.currency,
              price: p.price,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          },
        })),
      },
    ],
  };
}
