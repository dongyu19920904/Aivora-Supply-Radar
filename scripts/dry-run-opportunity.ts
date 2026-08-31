import {
  DEFAULT_SOURCE_REPO,
  fetchOpportunityDocument,
  opportunitySourceUrls,
  shanghaiDate,
} from "../src/ingest/opportunity";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requestedDate = argument("--date") ?? shanghaiDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) throw new Error("invalid_date_argument");

const urls = opportunitySourceUrls(DEFAULT_SOURCE_REPO, requestedDate);
const document = await fetchOpportunityDocument(urls.raw, urls.page, 30_000, 3);

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
