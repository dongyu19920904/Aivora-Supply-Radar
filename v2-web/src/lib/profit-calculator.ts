export interface ProfitInputs {
  unitCost: number;
  salePrice: number;
  quantity: number;
  paymentFeeRate: number;
  refundReserveRate: number;
  serviceReserveRate: number;
  fixedCost: number;
}

export interface ProfitResult {
  revenue: number;
  supplierCost: number;
  paymentFee: number;
  riskReserve: number;
  netProfit: number;
  marginRate: number;
  breakEvenPrice: number | null;
}

function safeNumber(value: number, min = 0, max = 1_000_000): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : 0;
}

export function calculateProfit(input: ProfitInputs): ProfitResult {
  const quantity = Math.max(1, Math.round(safeNumber(input.quantity, 1, 100_000)));
  const unitCost = safeNumber(input.unitCost);
  const salePrice = safeNumber(input.salePrice);
  const fixedCost = safeNumber(input.fixedCost);
  const paymentFeeRate = safeNumber(input.paymentFeeRate, 0, 100);
  const refundReserveRate = safeNumber(input.refundReserveRate, 0, 100);
  const serviceReserveRate = safeNumber(input.serviceReserveRate, 0, 100);
  const variableRate = (paymentFeeRate + refundReserveRate + serviceReserveRate) / 100;

  const revenue = salePrice * quantity;
  const supplierCost = unitCost * quantity;
  const paymentFee = revenue * paymentFeeRate / 100;
  const riskReserve = revenue * (refundReserveRate + serviceReserveRate) / 100;
  const netProfit = revenue - supplierCost - paymentFee - riskReserve - fixedCost;
  const marginRate = revenue > 0 ? netProfit / revenue * 100 : 0;
  const breakEvenPrice = variableRate < 1
    ? (unitCost + fixedCost / quantity) / (1 - variableRate)
    : null;

  return { revenue, supplierCost, paymentFee, riskReserve, netProfit, marginRate, breakEvenPrice };
}
