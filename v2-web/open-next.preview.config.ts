import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Preview serves build-time ISR/SSG entries from the Worker asset binding.
// The cache is read-only, so preview stays isolated from production R2/KV
// resources while dynamic APIs continue to read the live Supabase dataset.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
