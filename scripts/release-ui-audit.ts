import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = (
  process.env.UI_AUDIT_BASE_URL ||
  "https://aivora-supply-radar-v2-preview.sabrinamisan090.workers.dev"
).replace(/\/$/, "");
const outputDir = resolve(process.env.UI_AUDIT_OUTPUT || "artifacts/release-ui-audit");
const routes = (
  process.env.UI_AUDIT_ROUTES ||
  "/,/profit-calculator,/card-products,/channels,/opportunities,/submit"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const viewports = [
  { name: "phone-320", width: 320, height: 720 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 960 },
  { name: "laptop-1280", width: 1280, height: 800 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results: Array<Record<string, unknown>> = [];

try {
  for (const route of routes) {
    for (const viewport of viewports) {
      for (const colorScheme of route === "/" || route === "/profit-calculator"
        ? (["light", "dark"] as const)
        : (["light"] as const)) {
        const context = await browser.newContext({ viewport, colorScheme, locale: "zh-CN" });
        await context.addInitScript(
          (theme) => localStorage.setItem("aivora-supply-theme", theme),
          colorScheme,
        );
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text().slice(0, 500));
        });
        page.on("pageerror", (error) => errors.push(error.message.slice(0, 500)));

        const response = await page.goto(`${baseUrl}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
        await page.evaluate(() => document.fonts.ready);
        const diagnostics = await page.evaluate(() => {
          const navAffordances = Array.from(
            document.querySelectorAll<HTMLElement>(
              "header a, header button, nav a, footer a, footer button",
            ),
          );
          const wrappedAffordances = navAffordances
            .filter((element) => {
              if (!element.innerText.trim()) return false;

              const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
              const range = document.createRange();
              let textNode = walker.nextNode();
              let hasWrappedText = false;

              while (textNode) {
                if (textNode.textContent?.trim()) {
                  range.selectNodeContents(textNode);
                  const lineTops: number[] = [];
                  for (const rect of Array.from(range.getClientRects())) {
                    if (
                      rect.width > 0 &&
                      rect.height > 0 &&
                      !lineTops.some((top) => Math.abs(top - rect.top) < 3)
                    ) {
                      lineTops.push(rect.top);
                    }
                  }
                  if (lineTops.length > 1) {
                    hasWrappedText = true;
                    break;
                  }
                }
                textNode = walker.nextNode();
              }

              range.detach();
              return hasWrappedText;
            })
            .map((element) => element.innerText.trim().replace(/\s+/g, " ").slice(0, 80));
          return {
            title: document.title,
            h1Count: document.querySelectorAll("h1").length,
            canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || "",
            structuredDataCount: document.querySelectorAll('script[type="application/ld+json"]')
              .length,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            brokenImages: Array.from(document.images)
              .filter((image) => image.complete && image.naturalWidth === 0)
              .map((image) => image.currentSrc || image.src),
            wrappedAffordances,
            bodyFont: getComputedStyle(document.body).fontFamily,
            bodyBackground: getComputedStyle(document.body).backgroundColor,
            themeIsDark: document.documentElement.classList.contains("dark"),
          };
        });

        if (route === "/" && viewport.width === 390 && colorScheme === "light") {
          await page.getByRole("button", { name: /提交/ }).first().click();
          await page.getByRole("dialog").waitFor();
          const formFields = await page
            .locator('[role="dialog"] input, [role="dialog"] textarea')
            .count();
          Object.assign(diagnostics, { submissionDialogFields: formFields });
          await page.getByRole("button", { name: "关闭提交表单" }).click();
        }

        const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
        const screenshot = `${slug}-${viewport.name}-${colorScheme}.png`;
        await page.screenshot({
          path: resolve(outputDir, screenshot),
          fullPage: true,
          animations: "disabled",
        });
        results.push({
          route,
          viewport: viewport.name,
          colorScheme,
          status: response?.status() || 0,
          errors,
          screenshot,
          ...diagnostics,
        });
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

const failures = results.filter(
  (result) =>
    Number(result.status) >= 400 ||
    Number(result.overflow) !== 0 ||
    Number(result.h1Count) !== 1 ||
    (result.brokenImages as string[]).length > 0 ||
    (result.wrappedAffordances as string[]).length > 0 ||
    (result.errors as string[]).length > 0 ||
    !String(result.canonical).startsWith("http"),
);

const reportPath = resolve(outputDir, "report.json");
await writeFile(
  reportPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results, failures }, null, 2)}\n`,
  "utf8",
);
console.log(
  JSON.stringify({ reportPath, cases: results.length, failures: failures.length }, null, 2),
);
if (failures.length) process.exitCode = 1;
