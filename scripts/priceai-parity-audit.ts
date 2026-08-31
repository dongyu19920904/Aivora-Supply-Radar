import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const configuredSites = new Set(
  (process.env.PRICEAI_PARITY_SITES || "")
    .split(",")
    .map((site) => site.trim())
    .filter(Boolean),
);
const configuredRoutes = new Set(
  (process.env.PRICEAI_PARITY_ROUTES || "")
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean),
);
const aivoraBaseUrl = (
  process.env.PRICEAI_PARITY_AIVORA_BASE_URL || "https://supply.aivora.cn"
).replace(/\/$/, "");
const priceAiBaseUrl = (
  process.env.PRICEAI_PARITY_PRICEAI_BASE_URL || "https://priceai.cc"
).replace(/\/$/, "");

const targets = (
  [
    ["aivora", "home", `${aivoraBaseUrl}/`],
    ["aivora", "catalog", `${aivoraBaseUrl}/card-products`],
    ["aivora", "product", `${aivoraBaseUrl}/card-products/chatgpt-plus`],
    ["aivora", "offers", `${aivoraBaseUrl}/card-products/all`],
    ["aivora", "channels", `${aivoraBaseUrl}/channels`],
    ["aivora", "official", `${aivoraBaseUrl}/official-prices`],
    ["aivora", "opportunities", `${aivoraBaseUrl}/opportunities`],
    ["aivora", "wholesale", `${aivoraBaseUrl}/wholesale`],
    ["aivora", "commercial", `${aivoraBaseUrl}/commercial`],
    ["priceai", "home", `${priceAiBaseUrl}/`],
    ["priceai", "channels", `${priceAiBaseUrl}/channels`],
    ["priceai", "product", `${priceAiBaseUrl}/products/chatgpt-plus`],
    ["priceai", "official", `${priceAiBaseUrl}/official-prices`],
    ["priceai", "wholesale", `${priceAiBaseUrl}/wholesale`],
    ["priceai", "commercial", `${priceAiBaseUrl}/commercial`],
    ["priceai", "api-transit", `${priceAiBaseUrl}/api-transit`],
    ["priceai", "guides", `${priceAiBaseUrl}/guides`],
  ] as const
).filter(
  ([site, route]) =>
    (configuredSites.size === 0 || configuredSites.has(site)) &&
    (configuredRoutes.size === 0 || configuredRoutes.has(route)),
);

const viewports =
  process.env.PRICEAI_PARITY_EXTENDED_VIEWPORTS === "1"
    ? [
        { name: "phone-320", width: 320, height: 720 },
        { name: "phone-375", width: 375, height: 812 },
        { name: "phone-414", width: 414, height: 896 },
        { name: "tablet-768", width: 768, height: 960 },
        { name: "desktop-1440", width: 1440, height: 1000 },
      ]
    : [
        { name: "desktop", width: 1440, height: 1000 },
        { name: "mobile", width: 390, height: 844 },
      ];
const colorSchemes = (process.env.PRICEAI_PARITY_COLOR_SCHEMES || "light")
  .split(",")
  .map((value) => value.trim())
  .filter((value): value is "light" | "dark" => value === "light" || value === "dark");

const outputDir = resolve(process.env.PRICEAI_PARITY_OUTPUT || "artifacts/priceai-parity");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results: Array<Record<string, unknown>> = [];

try {
  for (const [site, route, url] of targets) {
    for (const viewport of viewports) {
      for (const colorScheme of colorSchemes) {
        const context = await browser.newContext({
          viewport,
          locale: "zh-CN",
          colorScheme,
        });
        await context.addInitScript(
          (theme) => localStorage.setItem("aivora-supply-theme", theme),
          colorScheme,
        );
        const page = await context.newPage();
        const consoleErrors: string[] = [];
        const requestFailures: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text().slice(0, 500));
        });
        page.on("requestfailed", (request) => {
          requestFailures.push(
            `${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.slice(
              0,
              500,
            ),
          );
        });

        const startedAt = Date.now();
        let status = 0;
        let navigationError = "";
        try {
          const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          status = response?.status() || 0;
          await page.waitForTimeout(2_500);
          await page.evaluate(() => document.fonts.ready).catch(() => undefined);
        } catch (error) {
          navigationError = error instanceof Error ? error.message : String(error);
        }

        const evidence = await page
          .evaluate(() => {
            const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  getComputedStyle(element).visibility !== "hidden"
                );
              })
              .map((anchor) => ({
                text: (anchor.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                href: anchor.href,
              }))
              .filter((link) => link.text)
              .slice(0, 100);
            const overflowElements = Array.from(document.querySelectorAll<HTMLElement>("body *"))
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
              })
              .slice(0, 20)
              .map((element) => ({
                tag: element.tagName.toLowerCase(),
                text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
              }));

            return {
              title: document.title,
              description:
                document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || "",
              canonical:
                document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || "",
              h1: Array.from(document.querySelectorAll("h1"))
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((element) =>
                  (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                ),
              headings: Array.from(document.querySelectorAll("h2,h3"))
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((element) =>
                  (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                )
                .slice(0, 80),
              navLabels: Array.from(
                document.querySelectorAll("header a, header button, nav a, nav button"),
              )
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((element) =>
                  (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                )
                .filter(Boolean),
              buttons: Array.from(document.querySelectorAll("button"))
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((element) =>
                  (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                )
                .filter(Boolean)
                .slice(0, 80),
              inputs: Array.from(document.querySelectorAll("input,select"))
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((input) => ({
                  type: input.tagName.toLowerCase(),
                  label: input.getAttribute("aria-label") || "",
                  placeholder: input.getAttribute("placeholder") || "",
                })),
              tableHeaders: Array.from(document.querySelectorAll("th"))
                .filter((element) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    getComputedStyle(element).visibility !== "hidden"
                  );
                })
                .map((element) =>
                  (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
                ),
              tableRows: document.querySelectorAll("tbody tr").length,
              catalogProducts: document.querySelectorAll("[data-catalog-product]").length,
              visibleLinks: links,
              externalLinkCount: links.filter(
                (link) => new URL(link.href).origin !== location.origin,
              ).length,
              bodyText: document.body.innerText.trim().replace(/\s+/g, " ").slice(0, 8_000),
              pageHeight: document.documentElement.scrollHeight,
              pageOverflow:
                document.documentElement.scrollWidth - document.documentElement.clientWidth,
              overflowElements,
              brokenImages: Array.from(document.images)
                .filter((image) => image.complete && image.naturalWidth === 0)
                .map((image) => image.currentSrc || image.src),
            };
          })
          .catch((error) => ({
            evaluationError: error instanceof Error ? error.message : String(error),
          }));

        const screenshot = `${site}-${route}-${viewport.name}-${colorScheme}.png`;
        if (!navigationError) {
          await page.screenshot({
            path: resolve(outputDir, screenshot),
            fullPage: false,
            animations: "disabled",
            caret: "initial",
          });
        }

        results.push({
          site,
          route,
          requestedUrl: url,
          finalUrl: page.url(),
          viewport: viewport.name,
          colorScheme,
          status,
          elapsedMs: Date.now() - startedAt,
          navigationError,
          consoleErrors: consoleErrors.slice(0, 20),
          requestFailures: requestFailures.slice(0, 30),
          screenshot,
          ...evidence,
        });
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

const reportPath = resolve(outputDir, "report.json");
await writeFile(
  reportPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
  "utf8",
);

const failures = results.filter((result) => result.navigationError || Number(result.status) >= 400);
console.log(JSON.stringify({ reportPath, cases: results.length, failures }, null, 2));
if (failures.some((result) => result.site === "aivora")) process.exitCode = 1;
