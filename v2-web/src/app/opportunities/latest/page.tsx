import { redirect } from 'next/navigation';

import { latestAccountOpportunityHref } from '@/lib/account-opportunity-navigation';
import { listAccountOpportunities } from '@/lib/legacy-radar';

export const dynamic = 'force-dynamic';

export default async function LatestAccountOpportunityPage() {
  const opportunities = await listAccountOpportunities(1);
  redirect(latestAccountOpportunityHref(opportunities));
}
