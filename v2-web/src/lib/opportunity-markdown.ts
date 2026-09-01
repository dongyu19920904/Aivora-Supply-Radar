const INTERNAL_REPLAY_METADATA = /<!--\s*opportunity-replay\s*:[\s\S]*?-->\s*/gi;

export function publicOpportunityMarkdown(markdown: string): string {
  return markdown.replace(INTERNAL_REPLAY_METADATA, '').trim();
}
