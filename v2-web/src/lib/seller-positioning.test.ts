import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('keeps the public shell focused on AI account sellers', () => {
  const home = source('../app/page.tsx');
  const publicShell = [
    home,
    source('../app/layout.tsx'),
    source('../components/Footer.tsx'),
    source('../components/GoToBuyButton.tsx'),
    source('../app/about/page.tsx'),
    source('../app/guide/page.tsx'),
  ].join('\n');

  assert.doesNotMatch(publicShell, /新手买订阅|AI 订阅买家|买家找货|消费者的困境|普通用户|前往购买|用户购买指南/);
  assert.match(home, /为 AI 账号卖家整理公开货源/);
  assert.match(publicShell, /卖家找货/);
  assert.equal((home.match(/\n\s+eyebrow:/g) || []).length, 2);
});
