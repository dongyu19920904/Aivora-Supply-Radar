import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials are not provided. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// 增加自定义 fetch 拦截器，解决构建时并发请求导致的 ECONNRESET 和 fetch failed
const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let retries = 2;
  while (retries > 0) {
    const controller = new AbortController();
    const forwardAbort = () => controller.abort(init?.signal?.reason);
    init?.signal?.addEventListener('abort', forwardAbort, { once: true });
    const timeout = setTimeout(() => controller.abort(new Error('supabase_request_timeout')), 6_000);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error: any) {
      const isConnectionReset = 
        error?.cause?.code === 'ECONNRESET' || 
        error?.code === 'ECONNRESET' || 
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network socket disconnected') ||
        (controller.signal.aborted && !init?.signal?.aborted);
        
      retries--;
      if (retries === 0 || !isConnectionReset) {
        throw error;
      }
      // One short retry handles transient edge resets without multiplying an outage.
      await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 500));
    } finally {
      clearTimeout(timeout);
      init?.signal?.removeEventListener('abort', forwardAbort);
    }
  }
  throw new Error('fetch failed after retries');
};

// Client for public / frontend usage (uses Anon Key)
export const supabase = createClient(
  env.SUPABASE_URL || 'https://supabase.invalid',
  env.SUPABASE_ANON_KEY || 'missing-anon-key',
  {
  global: {
    fetch: customFetch,
  },
});
