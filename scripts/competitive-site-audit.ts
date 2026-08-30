import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";

type AuditTarget = {
  site: string;
  url: string;
  viewports: Array<"desktop" | "mobile">;
  screenshot?: boolean;
};

const targets: AuditTarget[] = [
  {
    site: "aivora",
    url: "https://supply.aivora.cn/",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/products",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/card-products/all",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/card-products/chatgpt-plus",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/channels",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/official-prices",
    viewports: ["desktop", "mobile"],
  },
  { site: "aivora", url: "https://supply.aivora.cn/changes", viewports: ["desktop", "mobile"] },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/opportunities",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "aivora",
    url: "https://supply.aivora.cn/community",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  { site: "aivora", url: "https://supply.aivora.cn/submit", viewports: ["desktop", "mobile"] },
  { site: "aivora", url: "https://supply.aivora.cn/guide", viewports: ["desktop", "mobile"] },
  { site: "aivora", url: "https://supply.aivora.cn/methodology", viewports: ["desktop", "mobile"] },
  {
    site: "priceai",
    url: "https://priceai.cc/channels",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "priceai",
    url: "https://priceai.cc/products/chatgpt-plus",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  { site: "priceai", url: "https://priceai.cc/official-prices", viewports: ["desktop", "mobile"] },
  {
    site: "priceai",
    url: "https://priceai.cc/wholesale",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  { site: "priceai", url: "https://priceai.cc/commercial", viewports: ["desktop", "mobile"] },
  { site: "priceai", url: "https://priceai.cc/api-transit", viewports: ["desktop", "mobile"] },
  { site: "priceai", url: "https://priceai.cc/guides", viewports: ["desktop", "mobile"] },
  {
    site: "aideal",
    url: "https://closeman.asia/",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "withai",
    url: "https://withai.homes/",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  {
    site: "openprice",
    url: "https://www.openprice.cc/card-products",
    viewports: ["desktop", "mobile"],
    screenshot: true,
  },
  { site: "openprice", url: "https://www.openprice.cc/channels", viewports: ["desktop", "mobile"] },
  {
    site: "openprice",
    url: "https://www.openprice.cc/official-prices",
    viewports: ["desktop", "mobile"],
  },
  { site: "openprice", url: "https://www.openprice.cc/guide", viewports: ["desktop", "mobile"] },
];

const viewportMap = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
} as const;

const outputDir = resolve(process.env.COMPETITIVE_AUDIT_OUTPUT || "artifacts/competitive-audit");
await mkdir(outputDir, { recursive: true });

async function settle(page: Page) {
  await page.waitForTimeout(1_500);
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
}

const browser = await chromium.launch({ headless: true });
const results: Array<Record<string, unknown>> = [];

try {
  for (const target of targets) {
    for (const viewportName of target.viewports) {
      const viewport = viewportMap[viewportName];
      const context = await browser.newContext({
        viewport,
        colorScheme: "light",
        locale: "zh-CN",
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().slice(0, 1_000));
      });
      page.on("requestfailed", (request) => {
        requestFailures.push(
          `${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.slice(
            0,
            1_000,
          ),
        );
      });

      const startedAt = Date.now();
      let responseStatus = 0;
      let navigationError = "";
      try {
        const response = await page.goto(target.url, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        responseStatus = response?.status() || 0;
        await settle(page);
      } catch (error) {
        navigationError = error instanceof Error ? error.message : String(error);
      }

      const diagnostics = await page
        .evaluate(() => {
          const sameOriginLinks = Array.from(
            document.querySelectorAll<HTMLAnchorElement>("a[href]"),
          )
            .map((anchor) => {
              try {
                const url = new URL(anchor.href, location.href);
                return url.origin === location.origin ? `${url.pathname}${url.search}` : "";
              } catch {
                return "";
              }
            })
            .filter(Boolean);
          const clickableWraps = Array.from(document.querySelectorAll<HTMLElement>("a,button"))
            .filter((element) => {
              const text = element.innerText.trim();
              if (!text) return false;
              const style = getComputedStyle(element);
              const lineHeight = Number.parseFloat(style.lineHeight);
              return (
                Number.isFinite(lineHeight) &&
                element.getBoundingClientRect().height > lineHeight * 1.65
              );
            })
            .map((element) => element.innerText.trim().replace(/\s+/g, " ").slice(0, 100));
          const overflowingElements = Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
            })
            .slice(0, 20)
            .map((element) => ({
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className:
                typeof element.className === "string" ? element.className.slice(0, 160) : "",
              text: element.innerText?.trim().replace(/\s+/g, " ").slice(0, 100) || "",
            }));

          return {
            title: document.title,
            description:
              document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || "",
            canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || "",
            robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content || "",
            language: document.documentElement.lang,
            h1: Array.from(document.querySelectorAll("h1")).map(
              (heading) => heading.textContent?.trim() || "",
            ),
            h2Count: document.querySelectorAll("h2").length,
            mainTextLength:
              document.querySelector("main")?.textContent?.trim().length ||
              document.body.innerText.trim().length,
            structuredDataCount: document.querySelectorAll('script[type="application/ld+json"]')
              .length,
            tableCount: document.querySelectorAll("table").length,
            formCount: document.querySelectorAll("form").length,
            inputCount: document.querySelectorAll("input,select,textarea").length,
            buttonCount: document.querySelectorAll("button").length,
            internalLinks: Array.from(new Set(sameOriginLinks)).slice(0, 150),
            externalLinkCount: Array.from(
              document.querySelectorAll<HTMLAnchorElement>("a[href]"),
            ).filter((anchor) => {
              try {
                return new URL(anchor.href, location.href).origin !== location.origin;
              } catch {
                return false;
              }
            }).length,
            brokenImages: Array.from(document.images)
              .filter((image) => image.complete && image.naturalWidth === 0)
              .map((image) => image.currentSrc || image.src),
            pageOverflow:
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
            overflowingElements,
            clickableWraps: clickableWraps.slice(0, 30),
            bodyBackground: getComputedStyle(document.body).backgroundColor,
            bodyFont: getComputedStyle(document.body).fontFamily,
          };
        })
        .catch((error) => ({
          evaluationError: error instanceof Error ? error.message : String(error),
        }));

      const slug =
        new URL(target.url).pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]+/gi, "-") ||
        "home";
      const screenshotName = `${target.site}-${slug}-${viewportName}.png`;
      if (target.screenshot && !navigationError) {
        await page.screenshot({
          path: resolve(outputDir, screenshotName),
          fullPage: true,
          caret: "initial",
          animations: "disabled",
        });
      }

      results.push({
        site: target.site,
        requestedUrl: target.url,
        finalUrl: page.url(),
        viewport: viewportName,
        width: viewport.width,
        status: responseStatus,
        elapsedMs: Date.now() - startedAt,
        navigationError,
        consoleErrors: consoleErrors.slice(0, 20),
        requestFailures: requestFailures.slice(0, 30),
        screenshot: target.screenshot ? screenshotName : null,
        ...diagnostics,
      });
      await context.close();
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

const failedNavigations = results.filter(
  (result) => result.navigationError || Number(result.status) >= 400,
);
console.log(
  JSON.stringify(
    {
      reportPath,
      cases: results.length,
      failedNavigations: failedNavigations.length,
      failures: failedNavigations.map((result) => ({
        site: result.site,
        url: result.requestedUrl,
        viewport: result.viewport,
        status: result.status,
        error: result.navigationError,
      })),
    },
    null,
    2,
  ),
);

if (failedNavigations.some((result) => result.site === "aivora")) process.exitCode = 1;
