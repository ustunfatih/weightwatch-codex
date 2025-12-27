import { format, isValid, parse, parseISO } from 'date-fns';

const DATE_FORMATS = ['dd.MM.yyyy', 'dd-MM-yyyy', 'dd/MM/yyyy', 'd/M/yyyy', 'yyyy-MM-dd'];
const TIME_ONLY_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

export function parseDateFlexible(value: unknown, referenceDate?: Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Google Sheets serial date fallback
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (isValid(excelDate)) return excelDate;
    const timestampDate = new Date(value);
    return isValid(timestampDate) ? timestampDate : null;
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (TIME_ONLY_RE.test(trimmed)) {
    const base = referenceDate ? new Date(referenceDate) : new Date();
    const [hours, minutes, seconds] = trimmed.split(':').map((part) => Number(part));
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part))) return null;
    base.setHours(hours, minutes, seconds || 0, 0);
    return isValid(base) ? base : null;
  }

  if (trimmed.includes('T')) {
    const iso = parseISO(trimmed);
    if (isValid(iso)) return iso;
  }

  const base = trimmed.split(' ')[0];
  const isoBase = parseISO(base);
  if (isValid(isoBase)) return isoBase;

  for (const fmt of DATE_FORMATS) {
    const parsed = parse(base, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }

  const fallback = new Date(base);
  return isValid(fallback) ? fallback : null;
}

export function toISODate(value: unknown): string | null {
  const parsed = parseDateFlexible(value);
  if (!parsed) return null;
  return format(parsed, 'yyyy-MM-dd');
}

export function normalizeRecordedAt(dateIso: string, value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.includes('T')) {
      const parsed = parseDateFlexible(trimmed);
      return parsed ? parsed.toISOString() : trimmed;
    }
    if (TIME_ONLY_RE.test(trimmed)) {
      return `${dateIso}T${trimmed}`;
    }
  }

  const parsed = parseDateFlexible(value);
  return parsed ? parsed.toISOString() : undefined;
}
