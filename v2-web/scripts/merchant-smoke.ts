import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.AUDIT_BASE_URL || 'https://supply.aivora.cn';
const dailyPath = process.env.AUDIT_DAILY_PATH || '/opportunities/latest';
const browser = await chromium.launch({ headless: true });
try {
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noJs.newPage();
  const response = await page.goto(`${base}${dailyPath}`, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200);
  assert.ok(await page.getByText('浏览器未启用 JavaScript，下面显示完整日报。', { exact: true }).isVisible());
  for (const heading of ['新手今天照着做', '老商家今天看这三项', '数据和判断依据', '收盘填写结果']) {
    assert.ok(await page.locator('noscript').getByRole('heading', { name: heading, exact: true }).isVisible());
  }
  await noJs.close();
  console.log(JSON.stringify({ base, noJavascriptReadable: true }));
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 390, height: 844 } });
  const interactive = await context.newPage();
  await interactive.goto(`${base}${dailyPath}`, { waitUntil: 'networkidle' });
  await interactive.locator('[data-reading-mode="beginner"]').click();
  const copy = interactive.getByRole('button', { name: '复制今天的经营材料', exact: true });
  await copy.waitFor({ state: 'visible', timeout: 10000 });
  await copy.click();
  await interactive.getByRole('button', { name: '已复制，请核对后使用', exact: true }).waitFor();
  assert.match(await interactive.evaluate(() => navigator.clipboard.readText()), /付款前再次确认库存/);
  const check = interactive.locator('[data-beginner-checklist] input').first();
  await check.check();
  await interactive.reload({ waitUntil: 'networkidle' });
  await interactive.locator('[data-reading-mode="beginner"]').click();
  await interactive.waitForFunction(() => document.querySelector<HTMLInputElement>('[data-beginner-checklist] input')?.checked);
  await context.close();
  console.log(JSON.stringify({ base, noJavascriptReadable: true, copyContainsStockReminder: true, progressPersists: true }));
} finally { await browser.close(); }
