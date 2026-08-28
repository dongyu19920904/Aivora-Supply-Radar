import { AIVORA_OFFERS } from "../src/domain/catalog";

interface CheckTarget {
  key: string;
  url: string;
  expectedType: string;
}

const targets: CheckTarget[] = AIVORA_OFFERS.flatMap((offer) => [
  { key: `page:${offer.sourceOfferId}`, url: offer.url, expectedType: "text/html" },
  { key: `image:${offer.sourceOfferId}`, url: offer.imageUrl, expectedType: "image/" },
]);

async function inspect(target: CheckTarget): Promise<{ key: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    let response = await fetch(target.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Aivora-Supply-Radar-Source-Check/1.0" },
    });
    if (response.status === 405) {
      response = await fetch(target.url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Range: "bytes=0-1023",
          "User-Agent": "Aivora-Supply-Radar-Source-Check/1.0",
        },
      });
    }
    const finalUrl = new URL(response.url);
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!response.ok) return { key: target.key, error: `http_${response.status}` };
    if (finalUrl.hostname !== "www.aivora.cn") return { key: target.key, error: "unexpected_host" };
    if (!contentType.includes(target.expectedType))
      return { key: target.key, error: "content_type" };
    return { key: target.key };
  } catch (error) {
    return {
      key: target.key,
      error: error instanceof Error ? error.name.toLowerCase() : "request_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

const results: Array<{ key: string; error?: string }> = [];
for (let offset = 0; offset < targets.length; offset += 6) {
  results.push(...(await Promise.all(targets.slice(offset, offset + 6).map(inspect))));
}
const failures = results.filter((result) => result.error);
console.log(
  JSON.stringify(
    {
      status: failures.length === 0 ? "publishable" : "blocked",
      checked: results.length,
      pages: AIVORA_OFFERS.length,
      images: AIVORA_OFFERS.length,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length > 0) process.exitCode = 1;
