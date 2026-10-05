/** Site-wide SEO defaults and helpers for GYGI public pages. */

export const SITE_NAME = "Girls You've Got It (GYGI)";
export const SITE_NAME_SHORT = "GYGI";
export const BRAND_SUFFIX = " | Girls You've Got It (GYGI)";

export const DEFAULT_OG_IMAGE = "/Banner.jpg";

export const ORG = {
  name: "Girls You've Got It",
  alternateName: "GYGI",
  legalName: "Girls You've Got It (GYGI)",
  description:
    "GYGI is a free education movement unlocking skills, confidence, and opportunity for girls and young women across Africa through live classes, mentorship, and dignity programs.",
  email: "girlsyougotit25@gmail.com",
  phone: "+234 906 495 0175",
  address: {
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
  sameAs: [
    "https://www.facebook.com/girlsyougotit",
    "https://www.instagram.com/girlsyougotit",
    "https://www.linkedin.com/company/girls-youve-got-it",
    "https://twitter.com/girlsyougotit",
  ],
} as const;

export const PAGE_SEO = {
  home: {
    title: `Free Education for Girls in Africa | Live Classes & Mentorship${BRAND_SUFFIX}`,
    description:
      "Join GYGI for free live classes, mentorship, vocational skills, and dignity programs. Excellent education for girls and young women across Africa — always free.",
  },
  about: {
    title: `About GYGI — Free Education, Dignity & Opportunity for Girls${BRAND_SUFFIX}`,
    description:
      "Learn how Girls You've Got It delivers free excellent education, mentorship, and impact programs for girls and young women across Africa.",
  },
  blog: {
    title: `GYGI Journal — Stories of Learning, Dignity & Impact${BRAND_SUFFIX}`,
    description:
      "Read GYGI Journal stories on free education, mentorship, careers, skills, and dignity programs empowering girls and young women across Africa.",
  },
  explore: {
    title: `Explore Free Learning Programs & Categories${BRAND_SUFFIX}`,
    description:
      "Browse GYGI learning categories — tech, careers, mentorship, vocational skills, and more. Free excellent education for girls and young women.",
  },
  login: {
    title: `Sign in${BRAND_SUFFIX}`,
    description: "Sign in to your GYGI account for live classes, mentorship, and community learning.",
  },
  register: {
    title: `Join Free — Create Your GYGI Account${BRAND_SUFFIX}`,
    description:
      "Create a free GYGI account to access live classes, mentorship, and community-driven education for girls and young women.",
  },
} as const;

export function getSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  );
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://girlsyougotit.org";
}

export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return `${getSiteUrl()}${DEFAULT_OG_IMAGE}`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

export function withBrandTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return PAGE_SEO.home.title;
  if (
    trimmed.includes("GYGI") ||
    trimmed.includes("Girls You've Got It") ||
    trimmed.includes("Girls You Got It")
  ) {
    return trimmed;
  }
  return `${trimmed}${BRAND_SUFFIX}`;
}

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": ["NGO", "EducationalOrganization", "Organization"],
    name: ORG.name,
    alternateName: ORG.alternateName,
    legalName: ORG.legalName,
    url: getSiteUrl(),
    logo: absoluteUrl("/gygiLogo.jpg"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: ORG.description,
    email: ORG.email,
    telephone: ORG.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: ORG.address.addressLocality,
      addressCountry: ORG.address.addressCountry,
    },
    sameAs: [...ORG.sameAs],
    areaServed: "Africa",
    knowsAbout: [
      "Free education for girls",
      "Live online classes",
      "Mentorship",
      "Vocational skills",
      "Career literacy",
      "Dignity programs",
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url: getSiteUrl(),
    description: ORG.description,
    publisher: {
      "@type": "Organization",
      name: ORG.name,
      url: getSiteUrl(),
    },
    inLanguage: "en",
  };
}
