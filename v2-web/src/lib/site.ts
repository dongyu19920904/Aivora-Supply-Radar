export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.aivora.cn'
).replace(/\/$/, '');

export const SITE_NAME = '爱窝啦·货源雷达';
export const STORE_NAME = '爱窝啦·AI账号店';
export const STORE_URL = 'https://www.aivora.cn/';
export const PROJECT_REPOSITORY_URL = 'https://github.com/dongyu19920904/Aivora-Supply-Radar';

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const DEFAULT_SHARE_IMAGE = absoluteUrl('/aivora-supply-share.png');
