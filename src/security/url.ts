const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^.+\.localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

export function isSafePublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (!host || PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) return false;
    if (host.endsWith(".internal") || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchPublicResource(
  value: string,
  options: {
    timeoutMs?: number;
    maxBytes?: number;
    acceptedTypes?: string[];
    headers?: HeadersInit;
  } = {},
): Promise<Response> {
  if (!isSafePublicHttpsUrl(value)) throw new Error("unsafe_source_url");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
  try {
    let currentUrl = value;
    let response: Response | undefined;
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Aivora-Supply-Radar/1.0 (+https://supply.aivora.cn/methodology)",
          Accept:
            "application/json, application/ld+json, application/xml, text/xml, text/html, text/plain;q=0.8",
          ...options.headers,
        },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("source_redirect_limit");
      const target = new URL(location, currentUrl).toString();
      if (!isSafePublicHttpsUrl(target)) throw new Error("unsafe_source_redirect");
      await response.body?.cancel();
      currentUrl = target;
    }
    if (!response) throw new Error("source_no_response");
    if (!response.ok) throw new Error(`source_http_${response.status}`);
    const maxBytes = options.maxBytes ?? 2_000_000;
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > maxBytes) throw new Error("source_too_large");
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const accepted = options.acceptedTypes ?? [
      "application/json",
      "application/xml",
      "text/xml",
      "text/html",
      "text/plain",
    ];
    if (!accepted.some((type) => contentType.includes(type)))
      throw new Error("source_content_type");
    if (!response.body) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error("source_too_large");
      }
      chunks.push(chunk);
    }
    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timeout);
  }
}
