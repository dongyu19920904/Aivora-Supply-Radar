import assert from 'node:assert/strict';
import test from 'node:test';

import { parseArchiveMarkdown } from '../../scripts/import-account-opportunity-archive';

test('parses a historical report into the supply canonical contract', () => {
  const body = `## 今日经营判断\n\n${'这是可核验的账号商家经营日报正文。'.repeat(12)}\n\n<!-- opportunity-replay: {"entity":"internal"} -->`;
  const row = parseArchiveMarkdown(
    `---\ntitle: 爱窝啦 AI 账号商家经营日报 2026/8/31\ndate: 2026-08-31T00:00:00+08:00\ndescription: "库存、报价与利润纪律"\n---\n\n${body}`,
    '2026-08-31.md',
  );

  assert.equal(row.report_date, '2026-08-31');
  assert.equal(row.source_url, 'https://supply.aivora.cn/opportunities/2026-08-31');
  assert.match(row.source_sha, /^sha256:[a-f0-9]{64}$/);
  assert.match(row.body_markdown, /今日经营判断/);
  assert.doesNotMatch(row.body_markdown, /opportunity-replay/);
});

test('rejects malformed or thin archive files', () => {
  assert.throws(() => parseArchiveMarkdown('plain text', '2026-08-31.md'), /archive_frontmatter_missing/);
  assert.throws(
    () => parseArchiveMarkdown('---\ndate: 2026-08-31\n---\n太短', '2026-08-31.md'),
    /archive_body_too_short/,
  );
});
