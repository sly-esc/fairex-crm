export function sanitizeSearchQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[,()"%*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
