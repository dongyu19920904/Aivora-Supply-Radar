export interface ChannelSubmissionInput {
  name: string;
  siteUrl: string;
  contact: string;
  remarks: string;
  honeypot: string;
}

export type ChannelSubmissionValidation =
  | { ok: true; value: ChannelSubmissionInput }
  | { ok: false; error: string };

function boundedText(value: FormDataEntryValue | null, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength + 1) : '';
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] === 0;
}

export function normalizePublicHttpsUrl(value: string): string | null {
  if (!value || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!hostname.includes('.') || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) return null;
    if (hostname === '::1' || hostname.startsWith('[') || isPrivateIpv4(hostname)) return null;
    url.hash = '';
    if (url.pathname === '/') url.pathname = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function validateChannelSubmission(formData: FormData): ChannelSubmissionValidation {
  const honeypot = boundedText(formData.get('company_website'), 200);
  const rawName = boundedText(formData.get('site_name'), 160);
  const rawUrl = boundedText(formData.get('site_url'), 2_048);
  const contact = boundedText(formData.get('contact'), 240);
  const remarks = boundedText(formData.get('remarks'), 2_000);
  const siteUrl = normalizePublicHttpsUrl(rawUrl);

  if (rawName.length > 160 || contact.length > 240 || remarks.length > 2_000 || rawUrl.length > 2_048) {
    return { ok: false, error: '提交内容过长，请精简后重试' };
  }
  if (!siteUrl) return { ok: false, error: '请填写可公开访问的 HTTPS 网站地址' };

  return {
    ok: true,
    value: {
      name: rawName || '未命名（用户未提供）',
      siteUrl,
      contact,
      remarks,
      honeypot,
    },
  };
}
