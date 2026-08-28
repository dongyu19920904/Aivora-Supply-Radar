import { normalizeText } from "../domain/catalog";
import type { OpportunityDocument } from "../domain/types";
import { fetchPublicResource } from "../security/url";
import { recordSourceRun, upsertOpportunity } from "../services/database";

const DEFAULT_SOURCE_REPO = "dongyu19920904/Hextra-AI-Insight-Daily";

export function shanghaiDate(offsetDays = 0, now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const base = new Date(now.getTime() + offsetDays * 86_400_000);
  return formatter.format(base);
}

export function parseOpportunityMarkdown(markdown: string, sourceUrl: string): OpportunityDocument {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) throw new Error("opportunity_frontmatter_missing");
  const frontmatter = match[1] ?? "";
  const body = (match[2] ?? "").trim();
  const fields = new Map<string, string>();
  for (const line of frontmatter.split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (field?.[1]) fields.set(field[1], (field[2] ?? "").replace(/^['"]|['"]$/g, "").trim());
  }
  const rawDate = fields.get("date") ?? "";
  const reportDate = rawDate.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!reportDate) throw new Error("opportunity_date_missing");
  const title = fields.get("title") || `爱窝啦 AI 账号商机 ${reportDate}`;
  if (body.length < 80) throw new Error("opportunity_body_too_short");
  return {
    reportDate,
    title,
    description: fields.get("description") ?? "",
    bodyMarkdown: body,
    sourceUrl,
    publishedAt: rawDate || `${reportDate}T00:00:00+08:00`,
  };
}

export async function fetchOpportunityDocument(
  rawUrl: string,
  pageUrl: string,
  timeoutMs = 12_000,
  attempts = 2,
): Promise<OpportunityDocument> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchPublicResource(rawUrl, {
        timeoutMs,
        maxBytes: 500_000,
        acceptedTypes: ["text/plain"],
      });
      return parseOpportunityMarkdown(await response.text(), pageUrl);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "opportunity_fetch_failed";
      const nonRetryableClientError =
        /^source_http_4\d\d$/.test(message) && message !== "source_http_429";
      if (attempt === attempts || nonRetryableClientError) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }
  throw lastError;
}

function sourceUrls(repo: string, date: string): { raw: string; page: string } {
  const yearMonth = date.slice(0, 7);
  const encodedPath = `content/cn/account-opportunity/${yearMonth}/${date}.md`;
  return {
    raw: `https://raw.githubusercontent.com/${repo}/main/${encodedPath}`,
    page: `https://news.aivora.cn/account-opportunity/${yearMonth}/${date}/`,
  };
}

export async function syncLatestOpportunity(
  db: D1Database,
  sourceRepo = DEFAULT_SOURCE_REPO,
  targetDate = shanghaiDate(),
): Promise<{ status: string; date?: string; matchedProducts: number }> {
  const started = new Date();
  let discovered = 0;
  let lastError = "not_found";
  try {
    for (let offset = 0; offset > -14; offset -= 1) {
      const target = shanghaiDate(offset, new Date(`${targetDate}T04:00:00+08:00`));
      const urls = sourceUrls(sourceRepo, target);
      try {
        discovered += 1;
        const document = await fetchOpportunityDocument(urls.raw, urls.page, 12_000, 2);
        const normalizedBody = normalizeText(`${document.title}\n${document.bodyMarkdown}`);
        const products = await db
          .prepare("SELECT id, name, aliases_json FROM products WHERE is_visible = 1")
          .all<{
            id: number;
            name: string;
            aliases_json: string;
          }>();
        const matches = products.results.flatMap((product) => {
          const aliases = [product.name, ...(JSON.parse(product.aliases_json) as string[])];
          const matched = aliases.find((alias) => normalizedBody.includes(normalizeText(alias)));
          return matched ? [{ productId: product.id, reason: matched }] : [];
        });
        await upsertOpportunity(db, document, matches);
        await recordSourceRun(db, {
          sourceKey: "account-opportunity",
          runType: "sync",
          status: "success",
          discovered,
          accepted: 1,
          rejected: discovered - 1,
          durationMs: Date.now() - started.getTime(),
          startedAt: started.toISOString(),
          finishedAt: new Date().toISOString(),
        });
        return { status: "success", date: document.reportDate, matchedProducts: matches.length };
      } catch (error) {
        lastError =
          error instanceof Error ? error.message.slice(0, 80) : "opportunity_fetch_failed";
      }
    }
    await recordSourceRun(db, {
      sourceKey: "account-opportunity",
      runType: "sync",
      status: "stale",
      discovered,
      accepted: 0,
      rejected: discovered,
      durationMs: Date.now() - started.getTime(),
      errorCode: lastError,
      startedAt: started.toISOString(),
      finishedAt: new Date().toISOString(),
    });
    return { status: "stale", matchedProducts: 0 };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 80) : "opportunity_sync_failed";
    await recordSourceRun(db, {
      sourceKey: "account-opportunity",
      runType: "sync",
      status: "failed",
      discovered,
      accepted: 0,
      rejected: discovered,
      durationMs: Date.now() - started.getTime(),
      errorCode: code,
      startedAt: started.toISOString(),
      finishedAt: new Date().toISOString(),
    });
    throw error;
  }
}
