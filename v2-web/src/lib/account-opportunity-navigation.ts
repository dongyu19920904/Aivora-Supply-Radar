export interface DatedOpportunity {
  report_date: string;
}

export function latestAccountOpportunityHref(
  opportunities: readonly DatedOpportunity[],
): string {
  const reportDate = opportunities[0]?.report_date || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(reportDate)
    ? `/opportunities/${reportDate}`
    : '/opportunities';
}
