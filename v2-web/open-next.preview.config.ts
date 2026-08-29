import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// The preview Worker intentionally uses OpenNext's built-in stateless cache
// adapters. This keeps preview deployment isolated from production R2/KV
// resources when the deployment token only has Workers permissions.
export default defineCloudflareConfig();
