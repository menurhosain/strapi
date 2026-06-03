"use strict";

/**
 * Locale fallback middleware.
 * If a GET request to /api/* returns empty data for a non-default locale,
 * re-fetches with the default locale and returns that response instead.
 */
module.exports = (config, { strapi }) => {
  const defaultLocale = config?.defaultLocale ?? "en";

  return async (ctx, next) => {
    await next();

    // Only intercept GET requests to /api/* routes
    if (ctx.method !== "GET" || !ctx.path.startsWith("/api/")) return;

    const locale = ctx.query?.locale;

    // Nothing to fall back to if already using the default locale
    if (!locale || locale === defaultLocale) return;

    const body = ctx.body;
    const isEmpty =
      body?.data === null ||
      body?.data === undefined ||
      (Array.isArray(body?.data) && body.data.length === 0);

    if (!isEmpty) return;

    // Data is empty for requested locale — retry with default locale
    const port = strapi.config.get("server.port", 1337);
    const fallbackUrl = new URL(ctx.url, `http://localhost:${port}`);
    fallbackUrl.searchParams.set("locale", defaultLocale);

    try {
      const headers = {};
      if (ctx.headers.authorization) {
        headers.authorization = ctx.headers.authorization;
      }

      const res = await fetch(fallbackUrl.toString(), { headers });
      if (res.ok) {
        ctx.body = await res.json();
      }
    } catch {
      // Keep the original empty response on error
    }
  };
};
