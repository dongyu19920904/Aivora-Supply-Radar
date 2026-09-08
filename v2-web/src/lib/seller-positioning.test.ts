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
    source('../app/guide/first-sale/page.tsx'),
  ].join('\n');

  assert.doesNotMatch(publicShell, /新手买订阅|AI 订阅买家|买家找货|消费者的困境|普通用户|前往购买|用户购买指南/);
  assert.match(home, /为 AI 账号卖家整理公开货源/);
  assert.match(publicShell, /卖家找货/);
  assert.match(publicShell, /第一单只做一次可验证的小试卖/);
  assert.match(publicShell, /不会承诺成交或盈利/);
  assert.doesNotMatch(publicShell, /一做必赚|一定赚钱|保证盈利/);
  assert.equal((home.match(/\n\s+eyebrow:/g) || []).length, 2);
});
