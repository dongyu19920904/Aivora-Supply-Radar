import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const DATE_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.md$/;
const FRONT_MATTER_PATTERN = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVE_ROOT = path.resolve(SCRIPT_DIRECTORY, '../../content/cn/account-opportunity');

interface ArchiveRow {
  report_date: string;
  title: string;
  description: string;
  body_markdown: string;
  source_url: string;
  source_sha: string;
  published_at: string;
  source_synced_at: string;
  imported_at: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function frontMatterFields(value: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of value.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match?.[1]) continue;
    fields.set(match[1], (match[2] || '').replace(/^['"]|['"]$/g, '').trim());
  }
  return fields;
}

export function parseArchiveMarkdown(markdown: string, fileName: string): ArchiveRow {
  const match = markdown.match(FRONT_MATTER_PATTERN);
  if (!match) throw new Error(`archive_frontmatter_missing:${fileName}`);
  const fields = frontMatterFields(match[1] || '');
  const body = (match[2] || '').trim();
  const reportDate = fileName.replace(/\.md$/, '');
  const publishedAt = fields.get('date') || `${reportDate}T00:00:00+08:00`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) throw new Error(`archive_date_invalid:${fileName}`);
  if (!Number.isFinite(Date.parse(publishedAt))) throw new Error(`archive_published_at_invalid:${fileName}`);
  if (body.length < 80) throw new Error(`archive_body_too_short:${fileName}`);

  const now = new Date().toISOString();
  return {
    report_date: reportDate,
    title: (fields.get('title') || `爱窝啦 AI 账号商家经营日报 ${reportDate}`).slice(0, 200),
    description: (fields.get('description') || '').slice(0, 600),
    body_markdown: body.slice(0, 120_000),
    source_url: `https://supply.aivora.cn/opportunities/${reportDate}`,
    source_sha: `sha256:${createHash('sha256').update(markdown).digest('hex')}`,
    published_at: publishedAt,
    source_synced_at: now,
    imported_at: now,
  };
}

async function loadArchiveRows(): Promise<{ rows: ArchiveRow[]; rejected: string[] }> {
  const months = (await readdir(ARCHIVE_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
  const rows: ArchiveRow[] = [];
  const rejected: string[] = [];

  for (const month of months) {
    const monthDirectory = path.join(ARCHIVE_ROOT, month.name);
    const files = (await readdir(monthDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && DATE_FILE_PATTERN.test(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const file of files) {
      try {
        rows.push(parseArchiveMarkdown(await readFile(path.join(monthDirectory, file.name), 'utf8'), file.name));
      } catch (error) {
        rejected.push(error instanceof Error ? error.message : `archive_parse_failed:${file.name}`);
      }
    }
  }

  return { rows, rejected };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { rows, rejected } = await loadArchiveRows();
  if (!rows.length) throw new Error('account_opportunity_archive_empty');
  if (rejected.length) throw new Error(`account_opportunity_archive_rejected:${rejected.join('|')}`);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      discovered: rows.length,
      firstDate: rows[0]?.report_date,
      lastDate: rows.at(-1)?.report_date,
      rejected: 0,
      databaseWrites: 0,
      validation: 'passed',
    }));
    return;
  }

  const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing, error: existingError } = await supabase
    .from('account_opportunities')
    .select('report_date,source_sha');
  if (existingError) throw existingError;
  const existingShas = new Map((existing || []).map((row) => [row.report_date, row.source_sha]));
  const changedRows = rows.filter((row) => existingShas.get(row.report_date) !== row.source_sha);

  for (let index = 0; index < changedRows.length; index += 50) {
    const { error } = await supabase
      .from('account_opportunities')
      .upsert(changedRows.slice(index, index + 50), { onConflict: 'report_date' });
    if (error) throw error;
  }

  console.log(JSON.stringify({
    discovered: rows.length,
    imported: changedRows.length,
    skipped: rows.length - changedRows.length,
    rejected: 0,
    validation: 'passed',
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'account_opportunity_archive_import_failed');
    process.exitCode = 1;
  });
}
