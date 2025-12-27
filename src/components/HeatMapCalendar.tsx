import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, isSameDay, differenceInDays } from 'date-fns';
import { WeightEntry } from '../types';
import { parseDateFlexible } from '../utils/dateUtils';

interface HeatMapCalendarProps {
  entries: WeightEntry[];
  startDate: string;
}

export const HeatMapCalendar = ({ entries, startDate }: HeatMapCalendarProps) => {
  const entryByDay = useMemo(() => {
    const map = new Map<string, WeightEntry>();
    entries.forEach((entry) => {
      const dateObj = parseDateFlexible(entry.date);
      if (!dateObj) return;
      map.set(format(dateObj, 'yyyy-MM-dd'), entry);
    });
    return map;
  }, [entries]);

  // Generate calendar data
  const calendarData = useMemo(() => {
    const start = parseDateFlexible(startDate);
    if (!start) return { weeks: [], days: [] };
    const today = new Date();

    // Start from the beginning of the week containing startDate
    const calendarStart = startOfWeek(start, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = today;

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group by week
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);

      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return { weeks, days };
  }, [startDate]);

  // Get entry for a specific day
  const getEntryForDay = (day: Date): WeightEntry | null => {
    return entryByDay.get(format(day, 'yyyy-MM-dd')) || null;
  };

  // Get color for a day based on whether it has an entry
  const getDayColor = (day: Date): string => {
    const entry = getEntryForDay(day);
    const today = new Date();
    const isPast = day < today;
    const isToday = isSameDay(day, today);
    const start = parseDateFlexible(startDate);
    if (!start) return 'bg-transparent';
    const isBeforeStart = day < start;

    if (isBeforeStart) {
      return 'bg-transparent'; // Days before journey started
    }

    if (entry) {
      // Has entry - show in emerald
      return 'bg-[var(--accent-2)] hover:bg-[var(--accent-2)]';
    }

    if (isToday) {
      return 'bg-[var(--accent-3)] hover:bg-[var(--accent-3)]';
    }

    if (isPast) {
      // Missing entry - show in red
      return 'bg-[rgba(224,122,95,0.25)] hover:bg-[rgba(224,122,95,0.35)]';
    }

    // Future day - show in gray
    return 'bg-[rgba(28,31,36,0.08)] hover:bg-[rgba(28,31,36,0.12)]';
  };

  // Get tooltip for a day
  const getTooltip = (day: Date): string => {
    const entry = getEntryForDay(day);
    const dateStr = format(day, 'MMM dd, yyyy');

    if (entry) {
      return `${dateStr}: ${entry.weight.toFixed(1)} kg`;
    }

    const today = new Date();
    const isPast = day < today;
    const isToday = isSameDay(day, today);
    const start = parseDateFlexible(startDate);
    if (!start) return `${dateStr}: Before start date`;
    const isBeforeStart = day < start;

    if (isBeforeStart) {
      return `${dateStr}: Before start date`;
    }

    if (isToday) {
      return `${dateStr}: Today - No entry yet`;
    }

    if (isPast) {
      return `${dateStr}: No entry`;
    }

    return `${dateStr}: Future`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const start = parseDateFlexible(startDate);
    if (!start) {
      return {
        totalDays: 0,
        trackedDays: 0,
        missedDays: 0,
        consistencyPercent: 0,
      };
    }
    const today = new Date();
    const totalDays = differenceInDays(today, start) + 1;
    const trackedDays = entries.filter(entry => {
      const entryDate = parseDateFlexible(entry.date);
      if (!entryDate) return false;
      return entryDate >= start && entryDate <= today;
    }).length;

    const consistencyPercent = totalDays > 0 ? (trackedDays / totalDays) * 100 : 0;

    return {
      totalDays,
      trackedDays,
      missedDays: Math.max(0, totalDays - trackedDays),
      consistencyPercent,
    };
  }, [entries, startDate]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="card-elevated p-6">
      <div className="eyebrow mb-2">Consistency</div>
      <h2 className="font-display text-2xl font-black text-[var(--ink)] mb-6">Tracking Consistency</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--paper-2)] rounded-xl p-4 text-center border border-[color:var(--border-subtle)]">
          <div className="text-2xl font-bold text-[var(--accent-2)]">{stats.trackedDays}</div>
          <div className="text-xs text-[var(--ink-muted)] mt-1">Days Tracked</div>
        </div>
        <div className="bg-[var(--paper-2)] rounded-xl p-4 text-center border border-[color:var(--border-subtle)]">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.missedDays}</div>
          <div className="text-xs text-[var(--ink-muted)] mt-1">Days Missed</div>
        </div>
        <div className="bg-[var(--paper-2)] rounded-xl p-4 text-center border border-[color:var(--border-subtle)]">
          <div className="text-2xl font-bold text-[var(--accent-3)]">
            {stats.consistencyPercent.toFixed(0)}%
          </div>
          <div className="text-xs text-[var(--ink-muted)] mt-1">Consistency</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* Week day labels */}
          <div className="flex gap-1 mb-2">
            <div className="w-6" /> {/* Spacer for alignment */}
            {weekDays.map((day, i) => (
              <div key={i} className="w-3 text-xs text-[var(--ink-muted)] text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {calendarData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getDayColor(day)}`}
                  title={getTooltip(day)}
                />
              ))}
              {/* Fill remaining days of incomplete week */}
              {week.length < 7 &&
                Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-3 h-3" />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-[var(--ink-muted)]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-[rgba(28,31,36,0.08)] rounded-sm" title="Future" />
          <div className="w-3 h-3 bg-[rgba(224,122,95,0.25)] rounded-sm" title="Missed" />
          <div className="w-3 h-3 bg-[var(--accent-2)] rounded-sm" title="Tracked" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
