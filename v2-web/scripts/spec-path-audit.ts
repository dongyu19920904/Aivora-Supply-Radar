import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { offerSpecification } from '../src/lib/offer-specification';

const base = process.env.AUDIT_BASE_URL;
if (!base || !base.startsWith('https://')) throw new Error('Set AUDIT_BASE_URL to the preview or production origin');
const spec = '卡密充值 · 1个月 · 菲律宾';
const query = new URLSearchParams({ spec, report: '2026-09-20' });
const productPath = `/card-products/chatgpt-plus-recharge?${query}`;
const output = 'artifacts/spec-path-audit';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results: unknown[] = [];
try {
  for (const width of [1440, 390]) {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
      await context.addInitScript((value) => localStorage.setItem('aivora-supply-theme', value), theme);
      const page = await context.newPage();
      const response = await page.goto(`${base}${productPath}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      assert.equal(response?.status(), 200);
      assert.equal(await page.locator('#offer-spec').inputValue(), spec);
      assert.match(await page.locator('[data-active-specification]').innerText(), /卡密充值/);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${base}/card-products/chatgpt-plus-recharge`);
      // Use the page's network path (including the system browser proxy), not
      // Node's separate APIRequestContext resolver on Windows.
      const api = await page.evaluate(async (href) => {
        const response = await fetch(href);
        return { status: response.status, payload: await response.json() };
      }, `/api/products/chatgpt-plus-recharge/offers?${new URLSearchParams({ spec, limit: '50', offset: '0' })}`);
      assert.equal(api.status, 200);
      const payload = api.payload;
      assert.ok(payload.items.length > 0);
      assert.ok(payload.items.every((item: { originalName: string }) => offerSpecification(item.originalName) === spec));
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, dark: document.documentElement.classList.contains('dark') }));
      assert.ok(layout.overflow <= 1);
      assert.equal(layout.dark, theme === 'dark');
      const screenshot = `${output}/product-${width}-${theme}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      await page.screenshot({ path: `${output}/product-${width}-${theme}-viewport.png` });
      results.push({ width, theme, ...layout, total: payload.pageInfo.total, screenshot });
      await page.goto(`${base}/opportunities/2026-09-20`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForLoadState('load');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
      const sameSpecLink = page.locator('a[href*="/card-products/chatgpt-plus-recharge?"][href*="spec="]').first();
      assert.ok(await sameSpecLink.count());
      const url = new URL((await sameSpecLink.getAttribute('href'))!);
      assert.equal(url.searchParams.get('spec'), spec);
      assert.equal(url.searchParams.get('report'), '2026-09-20');
      for (const mode of ['overview', 'beginner', 'experienced']) {
        await page.locator(`[data-reading-mode="${mode}"]`).click();
        await page.waitForSelector(`[data-active-reading-mode="${mode}"]`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
      }
      await page.screenshot({ path: `${output}/daily-${width}-${theme}.png`, fullPage: true });
      await context.close();
    }
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noScript.newPage();
  await page.goto(`${base}${productPath}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  assert.ok(await page.locator('[data-active-specification]').count());
  assert.equal(await page.locator('#offer-spec').inputValue(), spec);
  await page.locator('#offer-spec').selectOption('');
  await Promise.all([page.waitForURL((url) => !url.searchParams.get('spec')), page.getByRole('button', { name: '查看所选规格', exact: true }).click()]);
  assert.equal(await page.locator('#offer-spec').inputValue(), '');
  await page.goto(`${base}/profit-calculator?${new URLSearchParams({ cost: '116', product: 'ChatGPT Plus', spec, report: '2026-09-20' })}`, { waitUntil: 'domcontentloaded' });
  assert.match(await page.locator('main').innerText(), /规格：卡密充值 · 1个月 · 菲律宾/);
  assert.match(await page.locator('main').innerText(), /不是当前成交价/);
  await noScript.close();
  await writeFile(`${output}/results.json`, JSON.stringify({ status: 'passed', base, results, noScript: 'passed', databaseWrites: 0 }, null, 2));
  console.log(JSON.stringify({ status: 'passed', base, results, noScript: 'passed' }));
} finally {
  await browser.close();
}
