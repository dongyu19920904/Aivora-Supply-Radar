import { isSafePublicHttpsUrl } from "../security/url";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value: string): string {
  let rendered = escapeHtml(value);
  rendered = rendered.replace(
    /\[([^\]]+)]\((https:\/\/[^\s)]+)\)/g,
    (_match, label: string, url: string) => {
      if (!isSafePublicHttpsUrl(url)) return escapeHtml(label);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="ugc noopener nofollow">${escapeHtml(label)}</a>`;
    },
  );
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  return rendered;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .slice(0, 1000);
  const output: string[] = [];
  let listOpen = false;
  const closeList = () => {
    if (listOpen) output.push("</ul>");
    listOpen = false;
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1]?.length ?? 2;
      output.push(`<h${level}>${renderInline(heading[2] ?? "")}</h${level}>`);
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      if (!listOpen) output.push("<ul>");
      listOpen = true;
      output.push(`<li>${renderInline(item[1] ?? "")}</li>`);
      continue;
    }
    closeList();
    output.push(`<p>${renderInline(line)}</p>`);
  }
  closeList();
  return output.join("\n");
}

export function formatPrice(value: unknown, currency = "CNY"): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "待核验";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: numeric < 10 ? 2 : 0,
  }).format(numeric);
}

export function formatDate(value: unknown): string {
  if (!value) return "未记录";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
