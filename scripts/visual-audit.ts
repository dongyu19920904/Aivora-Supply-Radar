import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:8788";
const outputDir = new URL("../artifacts/visual-audit/", import.meta.url);
await mkdir(outputDir, { recursive: true });

const cases = [
  { name: "home-desktop-light", path: "/", width: 1440, height: 1000, theme: "light" },
  { name: "home-desktop-dark", path: "/", width: 1440, height: 1000, theme: "dark" },
  { name: "products-mobile-light", path: "/products", width: 390, height: 844, theme: "light" },
  { name: "products-mobile-dark", path: "/products", width: 390, height: 844, theme: "dark" },
  {
    name: "product-detail-desktop-light",
    path: "/products/chatgpt-plus-renewal",
    width: 1440,
    height: 1000,
    theme: "light",
  },
] as const;

const browser = await chromium.launch({ headless: true });
const results: Array<Record<string, unknown>> = [];
let failed = false;

try {
  for (const auditCase of cases) {
    const context = await browser.newContext({
      viewport: { width: auditCase.width, height: auditCase.height },
      colorScheme: auditCase.theme,
      deviceScaleFactor: 1,
    });
    await context.addInitScript(
      (theme) => localStorage.setItem("aivora-theme", theme),
      auditCase.theme,
    );
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
    });
    const response = await page.goto(`${baseUrl}${auditCase.path}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.evaluate(() => document.fonts.ready);
    const diagnostics = await page.evaluate(() => ({
      title: document.title,
      theme: document.documentElement.dataset.theme,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brokenImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      mainText: document.querySelector("main")?.textContent?.trim().length ?? 0,
    }));
    const screenshotPath = new URL(`${auditCase.name}.png`, outputDir);
    await page.screenshot({ path: fileURLToPath(screenshotPath), fullPage: auditCase.width > 600 });
    const status = response?.status() ?? 0;
    const caseFailed =
      status !== 200 ||
      diagnostics.overflow > 1 ||
      diagnostics.brokenImages.length > 0 ||
      diagnostics.mainText < 100 ||
      diagnostics.theme !== auditCase.theme ||
      consoleErrors.length > 0;
    failed ||= caseFailed;
    results.push({
      name: auditCase.name,
      status,
      ...diagnostics,
      consoleErrors,
      screenshot: fileURLToPath(screenshotPath),
      result: caseFailed ? "failed" : "passed",
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ status: failed ? "blocked" : "publishable", results }, null, 2));
if (failed) process.exitCode = 1;
