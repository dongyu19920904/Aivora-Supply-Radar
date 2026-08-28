import { fetchOpportunityDocument, shanghaiDate } from "../src/ingest/opportunity";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requestedDate = argument("--date") ?? shanghaiDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) throw new Error("invalid_date_argument");

const yearMonth = requestedDate.slice(0, 7);
const path = `content/cn/account-opportunity/${yearMonth}/${requestedDate}.md`;
const rawUrl = `https://raw.githubusercontent.com/dongyu19920904/Hextra-AI-Insight-Daily/main/${path}`;
const pageUrl = `https://news.aivora.cn/account-opportunity/${yearMonth}/${requestedDate}/`;
const document = await fetchOpportunityDocument(rawUrl, pageUrl, 30_000, 3);

const result = {
  status: "publishable",
  requestedDate,
  reportDate: document.reportDate,
  title: document.title,
  sourceUrl: document.sourceUrl,
  bodyCharacters: document.bodyMarkdown.length,
  headings: document.bodyMarkdown.match(/^#{2,3}\s+/gm)?.length ?? 0,
  links: document.bodyMarkdown.match(/https:\/\//g)?.length ?? 0,
};

console.log(JSON.stringify(result, null, 2));
