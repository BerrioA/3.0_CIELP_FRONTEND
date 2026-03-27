import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const publicDir = resolve(projectRoot, "public");

const envName = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

const getSiteUrl = () => {
  const explicit =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }

  return "https://cielp.vercel.app";
};

const siteUrl = getSiteUrl();
const isProduction = envName === "production";

const publicRoutes = [
  "/",
  "/registro-profesor",
  "/politica-privacidad",
  "/terminos-uso",
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (path) =>
      `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${
        path === "/" ? "1.0" : "0.8"
      }</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

const robotsTxt = isProduction
  ? `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
  : `User-agent: *
Disallow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const rawVerificationToken = (
  process.env.VITE_GOOGLE_SITE_VERIFICATION ||
  process.env.GSC_VERIFICATION_TOKEN ||
  ""
).trim();

const normalizedVerificationToken = rawVerificationToken
  .replace(/^google/i, "")
  .replace(/\.html$/i, "")
  .trim();

const run = async () => {
  await mkdir(publicDir, { recursive: true });

  await writeFile(resolve(publicDir, "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(resolve(publicDir, "robots.txt"), robotsTxt, "utf8");

  if (normalizedVerificationToken) {
    const googleVerificationFile = `google${normalizedVerificationToken}.html`;
    const googleVerificationContent = `google-site-verification: ${googleVerificationFile}\n`;

    await writeFile(
      resolve(publicDir, googleVerificationFile),
      googleVerificationContent,
      "utf8",
    );
  }

  console.log(
    `[seo] SEO files generated for env=${envName} using siteUrl=${siteUrl}`,
  );
};

run().catch((error) => {
  console.error("[seo] Failed to generate SEO files:", error);
  process.exit(1);
});
