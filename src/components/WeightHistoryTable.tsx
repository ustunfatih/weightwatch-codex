import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { WeightEntry } from '../types';
import { parseDateFlexible } from '../utils/dateUtils';
import { formatChange } from '../utils/calculations';

type SortKey = 'date' | 'weight' | 'changeKg' | 'changePercent' | 'dailyChange';

interface WeightHistoryTableProps {
  entries: WeightEntry[];
}

export const WeightHistoryTable = ({ entries }: WeightHistoryTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedEntries = useMemo(() => {
    const copy = [...entries];
    const getValue = (entry: WeightEntry): number => {
      switch (sortKey) {
        case 'weight':
          return entry.weight;
        case 'changeKg':
          return entry.changeKg;
        case 'changePercent':
          return entry.changePercent;
        case 'dailyChange':
          return entry.dailyChange;
        case 'date':
        default: {
          const parsed = parseDateFlexible(entry.date);
          return parsed ? parsed.getTime() : 0;
        }
      }
    };

    copy.sort((a, b) => {
      const diff = getValue(a) - getValue(b);
      return sortDirection === 'asc' ? diff : -diff;
    });

    return copy;
  }, [entries, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'date' ? 'desc' : 'asc');
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)] p-6 text-sm text-[var(--ink-muted)]">
        No entries in this range yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--ink)]">Weight History</h3>
        <span className="text-xs text-[var(--ink-muted)]">{entries.length} entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-[var(--paper-3)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <button onClick={() => handleSort('date')} className="inline-flex items-center gap-1">
                  Date {sortIndicator('date')}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Day</th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => handleSort('weight')} className="inline-flex items-center gap-1">
                  Weight {sortIndicator('weight')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => handleSort('changeKg')} className="inline-flex items-center gap-1">
                  Change {sortIndicator('changeKg')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => handleSort('changePercent')} className="inline-flex items-center gap-1">
                  Change % {sortIndicator('changePercent')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => handleSort('dailyChange')} className="inline-flex items-center gap-1">
                  Daily {sortIndicator('dailyChange')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => {
              const parsedDate = parseDateFlexible(entry.date);
              const parsedTime = entry.recordedAt ? parseDateFlexible(entry.recordedAt) : null;
              const changeClass = entry.changeKg < 0 ? 'text-[var(--accent-2)]' : entry.changeKg > 0 ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]';

              return (
                <tr key={entry.date} className="border-b border-[color:var(--border-subtle)] last:border-b-0">
                  <td className="px-4 py-3 text-[var(--ink)]">
                    {parsedDate ? format(parsedDate, 'MMM dd, yyyy') : entry.date}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{entry.weekDay}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
                    {entry.weight.toFixed(1)} kg
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${changeClass}`}>
                    {formatChange(entry.changeKg)}
                  </td>
                  <td className={`px-4 py-3 text-right ${changeClass}`}>
                    {entry.changePercent >= 0 ? '+' : ''}{entry.changePercent.toFixed(2)}%
                  </td>
                  <td className={`px-4 py-3 text-right ${changeClass}`}>
                    {formatChange(entry.dailyChange)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--ink-muted)]">
                    {parsedTime ? format(parsedTime, 'HH:mm') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
