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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <React.Suspense fallback={<div className="py-8 text-center text-gray-500">Loading products...</div>}>
        <CardProductsClient initialProducts={mappedTypes} platformCount={platformCount} />
      </React.Suspense>
    </main>
  );
}
