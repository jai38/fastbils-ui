import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('formats YYYY-MM-DD string to DD-MM-YYYY', () => {
    expect(formatDate('2026-09-14')).toBe('14-09-2026');
    expect(formatDate('2024-04-01')).toBe('01-04-2024');
    expect(formatDate('2025-12-31')).toBe('31-12-2025');
  });

  it('formats ISO timestamp string to DD-MM-YYYY', () => {
    expect(formatDate('2026-09-14T10:30:00.000Z')).toBe('14-09-2026');
  });

  it('returns already formatted DD-MM-YYYY intact', () => {
    expect(formatDate('14-09-2026')).toBe('14-09-2026');
  });

  it('handles null, undefined and empty strings', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('   ')).toBe('');
  });

  it('formats Date object', () => {
    const d = new Date(2026, 8, 14); // Note: month index 8 is September
    expect(formatDate(d)).toBe('14-09-2026');
  });
});
