import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Static editorial pages are served from the Worker asset binding. Market,
// channel and opportunity pages opt into force-dynamic so synchronized data is
// read at request time without requiring R2/KV permissions.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
