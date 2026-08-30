import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3001';
const outputDir = new URL('../artifacts/visual-audit/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const allCases = [
  { name: 'home-desktop-light', path: '/', width: 1440, height: 1000, theme: 'light', mockOffers: false },
  { name: 'home-desktop-dark', path: '/', width: 1440, height: 1000, theme: 'dark', mockOffers: false },
  { name: 'products-desktop-light', path: '/card-products', width: 1440, height: 1000, theme: 'light', mockOffers: false },
  { name: 'products-desktop-dark', path: '/card-products', width: 1440, height: 1000, theme: 'dark', mockOffers: false },
  { name: 'products-mobile-light', path: '/card-products', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'products-mobile-dark', path: '/card-products', width: 390, height: 844, theme: 'dark', mockOffers: false },
  { name: 'all-products-mobile-light', path: '/card-products/all', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'product-detail-desktop-light', path: '/card-products/chatgpt-plus', width: 1440, height: 1000, theme: 'light', mockOffers: false },
  { name: 'product-detail-mobile-dark', path: '/card-products/chatgpt-plus', width: 390, height: 844, theme: 'dark', mockOffers: false },
  { name: 'opportunities-mobile-light', path: '/opportunities', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'changes-desktop-dark', path: '/changes', width: 1440, height: 1000, theme: 'dark', mockOffers: false },
] as const;
const requestedCase = process.env.AUDIT_CASE?.trim();
const cases = requestedCase ? allCases.filter((auditCase) => auditCase.name === requestedCase) : allCases;
if (!cases.length) throw new Error(`Unknown visual audit case: ${requestedCase}`);

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
    await context.addInitScript((theme) => {
      localStorage.setItem('aivora-supply-theme', theme);
    }, auditCase.theme);
    const page = await context.newPage();
    if (auditCase.mockOffers) {
      await page.route('**/api/offers/all?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            items: [
              {
                id: '24bee918-d2f4-4ecf-8ba1-f39f9b369c4a',
                title: 'ChatGPT Plus 独享成品号',
                price: 89,
                status: 'in_stock',
                url: 'https://example.com/product/chatgpt-plus',
                updatedAt: '2026-08-29T06:30:00.000Z',
                shopName: '示例授权渠道',
                category: 'ChatGPT Plus',
                platform: 'OpenAI',
                platformSortOrder: 1,
                productSortOrder: 1,
              },
            ],
            pageInfo: { hasMore: false, nextCursor: null },
          }),
        });
      });
    }
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 6_000));
    });

    const response = await page.goto(`${baseUrl}${auditCase.path}`, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });
    await page.evaluate(() => document.fonts.ready);
    const diagnostics = await page.evaluate(() => {
      const visibleCatalogRows = Array.from(
        document.querySelectorAll<HTMLElement>('[data-catalog-product]'),
      ).filter((row) => row.getClientRects().length > 0);
      const catalogActiveStates = visibleCatalogRows.map(
        (row) => row.dataset.activeOffer === 'true',
      );
      const visibleOfferRows = Array.from(
        document.querySelectorAll<HTMLElement>('[data-offer-status]'),
      ).filter((row) => row.getClientRects().length > 0);
      const offerStatuses = visibleOfferRows.map((row) => row.dataset.offerStatus || '');
      return {
        title: document.title,
        dark: document.documentElement.classList.contains('dark'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
        mainText: document.querySelector('main')?.textContent?.trim().length ?? 0,
        catalogProductCount: visibleCatalogRows.length,
        catalogFirstNames: visibleCatalogRows.slice(0, 3).map((row) => row.dataset.catalogName || ''),
        catalogUnavailableBeforeAvailable: catalogActiveStates.some(
          (active, index) => !active && catalogActiveStates.slice(index + 1).includes(true),
        ),
        catalogUnavailableCount: catalogActiveStates.filter((active) => !active).length,
        catalogSortControl: Boolean(document.querySelector('select[aria-label="商品排序"]')),
        offerAvailabilityFilterCount: document.querySelectorAll('[data-offer-availability]').length,
        offerZeroInventoryText: /库存\s*[:：]?\s*0(?:\D|$)/.test(document.body.innerText),
        offerUnavailableBeforeAvailable: offerStatuses.some(
          (status, index) => status !== 'in_stock' && offerStatuses.slice(index + 1).includes('in_stock'),
        ),
        unavailableFilterRows: 0,
        unavailableFilterOnlyUnavailable: false,
        unavailableFilterDisabledBuyButtons: 0,
      };
    });
    const screenshot = fileURLToPath(new URL(`${auditCase.name}.png`, outputDir));
    await page.screenshot({ path: screenshot, fullPage: true, caret: 'initial' });

    if (auditCase.path === '/card-products/chatgpt-plus') {
      const unavailableFilter = page.locator('[data-offer-availability="unavailable"]');
      if (await unavailableFilter.count()) {
        await Promise.all([
          page.waitForResponse(
            (response) => response.url().includes('/api/products/chatgpt-plus/offers')
              && response.url().includes('availability=unavailable'),
            { timeout: 30_000 },
          ),
          unavailableFilter.click(),
        ]);
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
        const unavailableFilterDiagnostics = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-offer-status]'))
            .filter((row) => row.getClientRects().length > 0);
          return {
            unavailableFilterRows: rows.length,
            unavailableFilterOnlyUnavailable: rows.length > 0
              && rows.every((row) => row.dataset.offerStatus !== 'in_stock'),
            unavailableFilterDisabledBuyButtons: rows.filter(
              (row) => Boolean(row.querySelector('button:disabled')),
            ).length,
          };
        });
        Object.assign(diagnostics, unavailableFilterDiagnostics);
      }
    }

    const status = response?.status() || 0;
    const themeMatches = diagnostics.dark === (auditCase.theme === 'dark');
    const catalogFailed = auditCase.path === '/card-products' && (
      diagnostics.catalogProductCount !== 24
      || !diagnostics.catalogFirstNames[0]?.includes('ChatGPT Plus')
      || diagnostics.catalogUnavailableBeforeAvailable
      || diagnostics.catalogUnavailableCount !== 0
      || !diagnostics.catalogSortControl
    );
    const detailFailed = auditCase.path === '/card-products/chatgpt-plus' && (
      diagnostics.offerAvailabilityFilterCount !== 3
      || diagnostics.offerZeroInventoryText
      || diagnostics.offerUnavailableBeforeAvailable
      || diagnostics.unavailableFilterOnlyUnavailable !== true
      || diagnostics.unavailableFilterRows !== diagnostics.unavailableFilterDisabledBuyButtons
    );
    const caseFailed = status !== 200
      || diagnostics.overflow > 1
      || diagnostics.brokenImages.length > 0
      || diagnostics.mainText < 80
      || !themeMatches
      || consoleErrors.length > 0
      || catalogFailed
      || detailFailed;
    failed ||= caseFailed;
    results.push({
      name: auditCase.name,
      status,
      ...diagnostics,
      themeMatches,
      catalogFailed,
      detailFailed,
      consoleErrors,
      screenshot,
      result: caseFailed ? 'failed' : 'passed',
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ status: failed ? 'blocked' : 'publishable', results }, null, 2));
if (failed) process.exitCode = 1;
