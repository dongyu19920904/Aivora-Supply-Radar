import type { ProductDetail } from '../data';

export function isOfferPurchasable(offer: Pick<ProductDetail, 'status'>): boolean {
  return offer.status === 'in_stock';
}

export function visibleInventory(
  offer: Pick<ProductDetail, 'status' | 'inventory'>,
): number | null {
  return isOfferPurchasable(offer)
    && typeof offer.inventory === 'number'
    && Number.isFinite(offer.inventory)
    && offer.inventory > 0
    ? offer.inventory
    : null;
}
