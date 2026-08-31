import React from 'react';
import { CardProductsClient } from './CardProductsClient';
import { getChannelProviderCount } from '../actions';
import { listCatalogSummaryProducts } from '../../lib/catalog-summary';

export const dynamic = 'force-dynamic';

export default async function CardProductsPage() {
  const [mappedTypes, platformCount] = await Promise.all([
    listCatalogSummaryProducts(),
    getChannelProviderCount(),
  ]);

  return (
    <main className="market-page py-8 sm:py-12">
      <div className="market-shell">
        <React.Suspense fallback={<div className="py-8 text-center text-gray-500">正在加载商品目录…</div>}>
          <CardProductsClient initialProducts={mappedTypes} platformCount={platformCount} />
        </React.Suspense>
      </div>
    </main>
  );
}
