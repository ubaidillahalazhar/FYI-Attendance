export const JENIS_LABEL = { pkl: 'PKL', outsourcing: 'Outsourcing' };

export function uniqueAsal(list) {
  const seen = new Map();
  for (const e of list) {
    const v = (e.asal || '').trim();
    if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export const matchesAsal = (value, filter) =>
  !filter || (value || '').trim().toLowerCase() === filter.trim().toLowerCase();
