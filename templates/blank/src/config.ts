// Edit these values for your site
const site = {
  // Your site name — shown in <title> and as the index page heading
  name: "My Site",
  // Your site description — shown in <meta name="description">
  description: undefined as string | undefined,
};

// Sites managed via notro-hub's dashboard settings panel ship a title and/or
// description as JSON in NOTRO_SITE_CONFIG (see notro-hub's CLAUDE.md,
// "Per-site settings contract"), which overrides the defaults above at build
// time. Self-hosted users who never set this env var are unaffected — the
// try/catch falls straight through to the defaults. This template has no
// header/nav chrome, so nav and locale entries in NOTRO_SITE_CONFIG are
// ignored here.
try {
  const raw = import.meta.env.NOTRO_SITE_CONFIG;
  if (raw) {
    const managed = JSON.parse(raw) as { title?: string; description?: string };
    if (managed.title) site.name = managed.title;
    if (managed.description) site.description = managed.description;
  }
} catch {
  // Malformed NOTRO_SITE_CONFIG — keep the defaults above.
}

const config = { site };

export default config;
