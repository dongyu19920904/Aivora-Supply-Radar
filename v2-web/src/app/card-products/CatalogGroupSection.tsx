import type { ProductType } from '../../data';
import type { CatalogCategory } from '../../lib/catalog-taxonomy';
import { hasActiveCatalogOffer } from '../../lib/product-ranking';
import { MasterTable } from '../../components/MasterTable';

interface CatalogGroupSectionProps {
  category: CatalogCategory;
  products: ProductType[];
  startIndex: number;
  order: number;
}

export function CatalogGroupSection({
  category,
  products,
  startIndex,
  order,
}: CatalogGroupSectionProps) {
  const availableProducts = products.filter(hasActiveCatalogOffer).length;
  const availableOffers = products.reduce((total, product) => total + product.channelCount, 0);

  return (
    <section
      id={`category-${category.id}`}
      data-catalog-category={category.id}
      data-catalog-category-name={category.name}
      className="scroll-mt-40 border-t-2 border-t-gray-950 pt-4"
      aria-labelledby={`category-${category.id}-title`}
    >
      <header className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold tabular-nums text-gray-400">
              {String(order).padStart(2, '0')}
            </span>
            <h2 id={`category-${category.id}-title`} className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
              {category.name}
            </h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-gray-500">{category.description}</p>
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <div className="flex items-baseline gap-1"><dt>商品</dt><dd className="font-mono font-semibold tabular-nums text-gray-950">{products.length}</dd></div>
          <div className="flex items-baseline gap-1"><dt>可购买</dt><dd className="font-mono font-semibold tabular-nums text-emerald-700">{availableProducts}</dd></div>
          <div className="flex items-baseline gap-1"><dt>在售报价</dt><dd className="font-mono font-semibold tabular-nums text-blue-700">{availableOffers}</dd></div>
        </dl>
      </header>
      <MasterTable products={products} startIndex={startIndex} />
    </section>
  );
}
