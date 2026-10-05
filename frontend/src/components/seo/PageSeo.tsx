import { useEffect } from "react";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  getSiteUrl,
  SITE_NAME,
  withBrandTitle,
  type JsonLd,
} from "@/lib/seo";

export type PageSeoProps = {
  title: string;
  description: string;
  /** Path only, e.g. `/blog` — used for canonical */
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  jsonLd?: JsonLd;
  /** Article extras */
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
};

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(data: JsonLd | undefined) {
  const id = "gygi-jsonld";
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Sets document title + head meta/OG/Twitter/canonical/JSON-LD for the current route.
 * Render once near the top of a page (returns null).
 */
export function PageSeo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noIndex = false,
  jsonLd,
  publishedTime,
  modifiedTime,
  authorName,
}: PageSeoProps) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = withBrandTitle(title);
    const desc = description.trim().slice(0, 320);
    const canonical = path
      ? absoluteUrl(path)
      : typeof window !== "undefined"
        ? window.location.href.split("#")[0]
        : getSiteUrl();
    const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

    document.title = fullTitle;

    upsertMeta("name", "description", desc);
    upsertMeta(
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    upsertMeta("name", "author", SITE_NAME);
    upsertMeta(
      "name",
      "keywords",
      "GYGI, Girls You've Got It, free education, girls education Africa, free online courses, mentorship, live classes, NGO Nigeria, vocational skills, Pad-A-Girl",
    );

    upsertLink("canonical", canonical);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:locale", "en_US");

    if (type === "article") {
      if (publishedTime)
        upsertMeta("property", "article:published_time", publishedTime);
      if (modifiedTime)
        upsertMeta("property", "article:modified_time", modifiedTime);
      if (authorName) upsertMeta("property", "article:author", authorName);
    }

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", ogImage);

    upsertJsonLd(jsonLdKey ? (JSON.parse(jsonLdKey) as JsonLd) : undefined);
  }, [
    title,
    description,
    path,
    image,
    type,
    noIndex,
    jsonLdKey,
    publishedTime,
    modifiedTime,
    authorName,
  ]);

  return null;
}

/** Lightweight noindex for authenticated app shells */
export function NoIndexSeo({ title = "GYGI" }: { title?: string }) {
  return (
    <PageSeo
      title={title}
      description="GYGI private workspace."
      noIndex
    />
  );
}

export default PageSeo;
