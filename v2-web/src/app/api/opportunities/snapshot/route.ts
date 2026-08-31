import { NextResponse } from 'next/server';

import { listCatalogSummaryProducts } from '@/lib/catalog-summary';
import { listPriceChanges } from '@/lib/legacy-radar';
import {
  buildPublicSupplyOpportunitySnapshot,
  buildSupplyOpportunityDashboard,
} from '@/lib/supply-opportunity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products, changes] = await Promise.all([
      listCatalogSummaryProducts(),
      listPriceChanges(),
    ]);
    if (!products.length) {
      return NextResponse.json(
        { error: 'Supply snapshot is temporarily unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const snapshot = buildPublicSupplyOpportunitySnapshot(
      buildSupplyOpportunityDashboard(products, changes),
    );
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(
      'Failed to build the public supply opportunity snapshot:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return NextResponse.json(
      { error: 'Supply snapshot is temporarily unavailable' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
