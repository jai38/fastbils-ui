/**
 * Standard date formatting utility for FastBills (DD-MM-YYYY)
 */

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (!trimmed) return '';

      // Direct YYYY-MM-DD pattern extraction
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}-${month}-${year}`;
      }

      // If it's already DD-MM-YYYY, return as is
      if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
        return trimmed;
      }

      // Try Date parser
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}-${month}-${year}`;
      }

      return trimmed;
    }

    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return '';
  } catch {
    return String(date);
  }
}
