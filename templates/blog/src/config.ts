// Edit these values for your site
const site = {
  // Your site name — shown in <title> and og:title
  name: "My Site",
  // Your site description — shown in <meta description> and og:description
  description: "My site powered by Notion and Astro.",
  /** Author name — used in JSON-LD structured data */
  author: "Your Name",
  /** BCP 47 language tag — used in <html lang="..."> */
  lang: "ja",
  /** og:locale — typically lang + region, e.g. "ja_JP", "en_US" */
  locale: "ja_JP",
};

// Edit these links for your site header navigation
const nav: { href: string; label: string }[] = [
  { href: "/blog/", label: "ブログ" },
];

// Sites managed via notro-hub's dashboard settings panel ship a title,
// description, nav, and/or base locale as JSON in NOTRO_SITE_CONFIG (see
// notro-hub's CLAUDE.md, "Per-site settings contract"), which overrides the
// defaults above at build time. Self-hosted users who never set this env var
// are unaffected — the try/catch falls straight through to the defaults.
const localeTags: Record<"en" | "ja" | "zh", { lang: string; ogLocale: string }> = {
  en: { lang: "en", ogLocale: "en_US" },
  ja: { lang: "ja", ogLocale: "ja_JP" },
  zh: { lang: "zh", ogLocale: "zh_CN" },
};

try {
  const raw = import.meta.env.NOTRO_SITE_CONFIG;
  if (raw) {
    const managed = JSON.parse(raw) as {
      title?: string;
      description?: string;
      nav?: { label: string; href: string }[];
      locale?: "en" | "ja" | "zh";
    };
    if (managed.title) site.name = managed.title;
    if (managed.description) site.description = managed.description;
    if (managed.locale) {
      const tags = localeTags[managed.locale];
      site.lang = tags.lang;
      site.locale = tags.ogLocale;
    }
    if (managed.nav?.length) {
      nav.length = 0;
      nav.push(...managed.nav.map(({ label, href }) => ({ href, label })));
    }
  }
} catch {
  // Malformed NOTRO_SITE_CONFIG — keep the defaults above.
}

const config = {
  site,
  analytics: {
    /**
     * Google Analytics 4 Measurement ID (e.g. "G-XXXXXXXXXX").
     * Set to undefined to disable analytics entirely.
     * Uses Partytown to offload gtag to a web worker.
     */
    gaMeasurementId: undefined as string | undefined,
  },
  blog: {
    postsPerPage: 10,
    // Shown as <meta description> on the blog list page
    description: "",
    // System tags — affect post filtering logic (not shown as public tags)
    // "page"   — marks a Notion post as a fixed page (excluded from blog listing)
    // "pinned" — marks a post to appear at the top of the blog list (page 1 only)
    internalTags: ["page", "pinned"] as string[],
  },
  navigation: { nav },
};

export default config;
