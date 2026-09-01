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
  { name: 'product-alias-redirect', path: '/card-products/chatgpt-plus-trial', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'opportunities-mobile-light', path: '/opportunities', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'account-daily-desktop-light', path: '/opportunities/latest', width: 1440, height: 1000, theme: 'light', mockOffers: false },
  { name: 'account-daily-desktop-dark', path: '/opportunities/latest', width: 1440, height: 1000, theme: 'dark', mockOffers: false },
  { name: 'account-daily-mobile-light', path: '/opportunities/latest', width: 390, height: 844, theme: 'light', mockOffers: false },
  { name: 'account-daily-mobile-dark', path: '/opportunities/latest', width: 390, height: 844, theme: 'dark', mockOffers: false },
  { name: 'changes-desktop-dark', path: '/changes', width: 1440, height: 1000, theme: 'dark', mockOffers: false },
] as const;
const requestedCase = process.env.AUDIT_CASE?.trim();
const cases = requestedCase ? allCases.filter((auditCase) => auditCase.name === requestedCase) : allCases;
if (!cases.length) throw new Error(`Unknown visual audit case: ${requestedCase}`);

const browser = await chromium.launch({ headless: true });
const results: Array<Record<string, unknown>> = [];
let failed = false;

function contrastRatio(colors: { foreground: string; background: string }) {
  const luminance = (value: string) => {
    const [red = 0, green = 0, blue = 0] = (value.match(/[\d.]+/g) || []).map(Number);
    const channels = [red, green, blue].map((channelValue) => {
      const channel = channelValue / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const foreground = luminance(colors.foreground);
  const background = luminance(colors.background);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

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
    let catalogDropdownOptionIds: string[] = [];
    if (auditCase.path === '/card-products') {
      const categoryDropdown = page.locator('input[aria-label="平台分类筛选"]');
      if (await categoryDropdown.count()) {
        await categoryDropdown.click();
        catalogDropdownOptionIds = await page.locator('[data-dropdown-option]').evaluateAll(
          (nodes) => nodes.map((node) => (node as HTMLElement).dataset.dropdownOption || ''),
        );
        await page.keyboard.press('Escape');
        await page.locator('body').click({ position: { x: 1, y: 1 } });
      }
    }
    const diagnostics = {
      ...(await page.evaluate(() => {
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
      const visibleCategorySections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-catalog-category]'),
      ).filter((section) => section.getClientRects().length > 0);
      const categoryIds = visibleCategorySections.map((section) => section.dataset.catalogCategory || '');
      const unavailableBeforeAvailableWithinCategory = visibleCategorySections.some((section) => {
        const states = Array.from(section.querySelectorAll<HTMLElement>('[data-catalog-product]'))
          .filter((row) => row.getClientRects().length > 0)
          .map((row) => row.dataset.activeOffer === 'true');
        return states.some((active, index) => !active && states.slice(index + 1).includes(true));
      });
      return {
        currentUrl: window.location.href,
        title: document.title,
        dark: document.documentElement.classList.contains('dark'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
        mainText: document.querySelector('main')?.textContent?.trim().length ?? 0,
        catalogProductCount: visibleCatalogRows.length,
        catalogFirstNames: visibleCatalogRows.slice(0, 3).map((row) => row.dataset.catalogName || ''),
        catalogSlugs: visibleCatalogRows.map((row) => row.dataset.catalogSlug || ''),
        catalogNamesUnique: new Set(visibleCatalogRows.map((row) => row.dataset.catalogName || '')).size === visibleCatalogRows.length,
        catalogUnavailableBeforeAvailable: catalogActiveStates.some(
          (active, index) => !active && catalogActiveStates.slice(index + 1).includes(true),
        ),
        catalogUnavailableCount: catalogActiveStates.filter((active) => !active).length,
        catalogSortControl: Boolean(document.querySelector('select[aria-label="商品排序"]')),
        catalogCategoryIds: categoryIds,
        catalogCategoryIdsUnique: new Set(categoryIds).size === categoryIds.length,
        catalogUnavailableBeforeAvailableWithinCategory: unavailableBeforeAvailableWithinCategory,
        catalogCategoryFilterIds: Array.from(document.querySelectorAll<HTMLElement>('[data-catalog-category-filter]'))
          .map((button) => button.dataset.catalogCategoryFilter || ''),
        offerAvailabilityFilterCount: document.querySelectorAll('[data-offer-availability]').length,
        offerZeroInventoryText: /库存\s*[:：]?\s*0(?:\D|$)/.test(document.body.innerText),
        offerUnavailableBeforeAvailable: offerStatuses.some(
          (status, index) => status !== 'in_stock' && offerStatuses.slice(index + 1).includes('in_stock'),
        ),
        unavailableFilterRows: 0,
        unavailableFilterOnlyUnavailable: false,
        unavailableFilterDisabledBuyButtons: 0,
        opportunityLiveDashboard: Boolean(document.querySelector('[data-opportunity-live-dashboard]')),
        opportunitySignalCount: document.querySelectorAll('[data-supply-opportunity]').length,
        opportunityProductLinkCount: document.querySelectorAll('[data-opportunity-product-link]').length,
        opportunitySupplyMap: Boolean(document.querySelector('[data-opportunity-supply-map]')),
        opportunityIndustryArchive: Boolean(document.querySelector('[data-opportunity-industry-archive]')),
        accountDailyNavVisible: Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href="/opportunities/latest"]'))
          .some((link) => link.getClientRects().length > 0 && /日报/.test(link.textContent || '')),
        accountDailyBodyBeforeSupply: (() => {
          const body = document.querySelector<HTMLElement>('article .prose');
          const supply = document.querySelector<HTMLElement>('[data-opportunity-related-supply]');
          return Boolean(body && supply && body.offsetTop < supply.offsetTop);
        })(),
        accountDailyFirstHeading: document.querySelector<HTMLElement>('article .prose h2')?.textContent?.trim() || '',
        accountDailyCanonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || '',
        accountDailySchema: Boolean(document.querySelector('script[type="application/ld+json"]')),
        accountDailyHeroColors: (() => {
          const element = document.querySelector<HTMLElement>('[data-account-daily-hero] h1');
          if (!element) return { foreground: '', background: '' };
          let background = 'rgb(255, 255, 255)';
          let current: HTMLElement | null = element;
          while (current) {
            const value = getComputedStyle(current).backgroundColor;
            const channels = (value.match(/[\d.]+/g) || []).map(Number);
            if (channels.length >= 3 && (channels[3] ?? 1) > 0) {
              background = value;
              break;
            }
            current = current.parentElement;
          }
          return { foreground: getComputedStyle(element).color, background };
        })(),
        accountDailyHeadingColors: (() => {
          const element = document.querySelector<HTMLElement>('article .prose h2');
          if (!element) return { foreground: '', background: '' };
          let background = 'rgb(255, 255, 255)';
          let current: HTMLElement | null = element;
          while (current) {
            const value = getComputedStyle(current).backgroundColor;
            const channels = (value.match(/[\d.]+/g) || []).map(Number);
            if (channels.length >= 3 && (channels[3] ?? 1) > 0) {
              background = value;
              break;
            }
            current = current.parentElement;
          }
          return { foreground: getComputedStyle(element).color, background };
        })(),
        productDecisionSummary: Boolean(document.querySelector('[data-product-decision-summary]')),
        };
      })),
      catalogDropdownOptionIds,
    };
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
        await page.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-offer-status]'))
            .filter((row) => row.getClientRects().length > 0);
          return rows.length > 0
            && rows.every((row) => row.dataset.offerStatus !== 'in_stock')
            && rows.every((row) => Boolean(row.querySelector('button:disabled')));
        }, undefined, { timeout: 10_000 }).catch(() => undefined);
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
    const accountDailyHeroContrast = contrastRatio(diagnostics.accountDailyHeroColors);
    const accountDailyHeadingContrast = contrastRatio(diagnostics.accountDailyHeadingColors);
    const catalogFailed = auditCase.path === '/card-products' && (
      diagnostics.catalogProductCount !== 49
      || !diagnostics.catalogFirstNames[0]?.includes('ChatGPT')
      || !diagnostics.catalogNamesUnique
      || diagnostics.catalogSlugs.some((slug) => [
        'chatgpt-plus-trial',
        'chatgpt-plus-renewal',
        'chatgpt-account',
        'chatgpt-team',
        'claude-pro',
      ].includes(slug))
      || diagnostics.catalogCategoryIds[0] !== 'chatgpt'
      || diagnostics.catalogCategoryIds.join(',') !== 'chatgpt,claude,gemini,grok,ai-coding,ai-creative,email,verification,social,api-payment,other'
      || !diagnostics.catalogCategoryIdsUnique
      || diagnostics.catalogUnavailableBeforeAvailableWithinCategory
      || diagnostics.catalogCategoryFilterIds[1] !== 'chatgpt'
      || diagnostics.catalogDropdownOptionIds[1] !== 'chatgpt'
      || !diagnostics.catalogSortControl
    );
    const detailFailed = auditCase.path === '/card-products/chatgpt-plus' && (
      diagnostics.offerAvailabilityFilterCount !== 3
      || !diagnostics.productDecisionSummary
      || diagnostics.offerZeroInventoryText
      || diagnostics.offerUnavailableBeforeAvailable
      || diagnostics.unavailableFilterOnlyUnavailable !== true
      || diagnostics.unavailableFilterRows !== diagnostics.unavailableFilterDisabledBuyButtons
    );
    const opportunityFailed = auditCase.path === '/opportunities' && (
      !diagnostics.opportunityLiveDashboard
      || diagnostics.opportunitySignalCount < 1
      || diagnostics.opportunityProductLinkCount < 1
      || !diagnostics.opportunitySupplyMap
      || !diagnostics.opportunityIndustryArchive
    );
    const aliasRedirectFailed = auditCase.path === '/card-products/chatgpt-plus-trial'
      && !diagnostics.currentUrl.endsWith('/card-products/chatgpt-plus');
    const accountDailyFailed = auditCase.path === '/opportunities/latest' && (
      !/\/opportunities\/\d{4}-\d{2}-\d{2}$/.test(new URL(diagnostics.currentUrl).pathname)
      || !diagnostics.accountDailyNavVisible
      || !diagnostics.accountDailyBodyBeforeSupply
      || !diagnostics.accountDailyFirstHeading
      || !diagnostics.accountDailyCanonical.endsWith(new URL(diagnostics.currentUrl).pathname)
      || !diagnostics.accountDailySchema
      || (auditCase.theme === 'dark' && accountDailyHeroContrast < 4.5)
      || (auditCase.theme === 'dark' && accountDailyHeadingContrast < 4.5)
    );
    const caseFailed = status !== 200
      || diagnostics.overflow > 1
      || diagnostics.brokenImages.length > 0
      || diagnostics.mainText < 80
      || !themeMatches
      || consoleErrors.length > 0
      || catalogFailed
      || detailFailed
      || opportunityFailed
      || aliasRedirectFailed
      || accountDailyFailed;
    failed ||= caseFailed;
    results.push({
      name: auditCase.name,
      status,
      ...diagnostics,
      themeMatches,
      catalogFailed,
      detailFailed,
      opportunityFailed,
      aliasRedirectFailed,
      accountDailyFailed,
      accountDailyHeroContrast,
      accountDailyHeadingContrast,
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
