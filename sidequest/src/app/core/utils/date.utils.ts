/**
 * Returns the current month as a "YYYY-MM" string.
 * Used as the `month` field on quests and drawn consequences.
 *
 * Example: "2025-05"
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Converts a Firestore Timestamp (or plain Date) to a JS Date.
 * Firestore returns Timestamp objects with a .toDate() method;
 * this utility normalises whatever comes back from the SDK.
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
  return new Date(value as string | number);
}

/**
 * Formats a "YYYY-MM" month string for display.
 * Example: "2025-05" → "May 2025"
 */
export function formatMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}