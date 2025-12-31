import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Brush,
} from 'recharts';
import { Download, FileText, Table } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { WeightEntry, TargetData } from '../types';
import { format, parseISO, startOfWeek, startOfMonth, differenceInDays, addDays } from 'date-fns';
import { STORAGE_KEYS, readString, writeString } from '../services/storage';
import { parseDateFlexible } from '../utils/dateUtils';
import { exportElementToPNG, exportToCSV } from '../services/exportService';
import { WeightHistoryTable } from './WeightHistoryTable';

interface TimelineChartProps {
  entries: WeightEntry[];
  targetData: TargetData;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  weight: number | null;
  target: number;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const TimelineChart: React.FC<TimelineChartProps> = ({ entries, targetData }) => {
  // Load saved view preference from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = readString(STORAGE_KEYS.TIMELINE_VIEW);
    return (saved as ViewMode) || 'daily';
  });
  const [showTable, setShowTable] = useState(false);
  const [range, setRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Save view preference when it changes
  useEffect(() => {
    writeString(STORAGE_KEYS.TIMELINE_VIEW, viewMode);
  }, [viewMode]);

  useEffect(() => {
    setRange(null);
  }, [viewMode, entries.length]);

  const startDate = useMemo(
    () => parseDateFlexible(targetData.startDate) ?? new Date(),
    [targetData.startDate]
  );
  const endDate = useMemo(
    () => parseDateFlexible(targetData.endDate) ?? new Date(),
    [targetData.endDate]
  );
  const dailyTargetLoss = useMemo(
    () => targetData.totalKg / Math.max(targetData.totalDuration, 1),
    [targetData.totalKg, targetData.totalDuration]
  );
  const calculateTargetForDate = useCallback((date: Date): number => {
    const daysFromStart = differenceInDays(date, startDate);
    return targetData.startWeight - (dailyTargetLoss * daysFromStart);
  }, [dailyTargetLoss, startDate, targetData.startWeight]);

  // Memoize chart data generation based on view mode
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const parsedEntries = entries
      .map((entry) => ({
        ...entry,
        dateObj: parseDateFlexible(entry.date),
      }))
      .filter((entry): entry is WeightEntry & { dateObj: Date } => Boolean(entry.dateObj));

    // Sort entries by date
    const sortedEntries = [...parsedEntries].sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );

    let dataPoints: ChartDataPoint[] = [];

    if (viewMode === 'daily') {
      // Daily view: Need to merge actual data with evenly-spaced target points
      // Strategy: Create all necessary points to ensure both lines render properly

      const allPoints = new Map<string, ChartDataPoint>();

      // Add all actual weight entries
      sortedEntries.forEach(entry => {
        allPoints.set(entry.date, {
          date: format(entry.dateObj, 'MMM dd'),
          fullDate: entry.date,
          weight: entry.weight,
          target: calculateTargetForDate(entry.dateObj),
        });
      });

      // Explicitly ensure start and end dates are included for straight target line
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      if (!allPoints.has(startDateStr)) {
        allPoints.set(startDateStr, {
          date: format(startDate, 'MMM dd'),
          fullDate: startDateStr,
          weight: null,
          target: calculateTargetForDate(startDate),
        });
      }

      if (!allPoints.has(endDateStr)) {
        allPoints.set(endDateStr, {
          date: format(endDate, 'MMM dd'),
          fullDate: endDateStr,
          weight: null,
          target: calculateTargetForDate(endDate),
        });
      }

      // Add evenly-spaced points for straight target line (every 3 days from start to end)
      let currentDate = startDate;
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!allPoints.has(dateStr)) {
          allPoints.set(dateStr, {
            date: format(currentDate, 'MMM dd'),
            fullDate: dateStr,
            weight: null,
            target: calculateTargetForDate(currentDate),
          });
        }
        currentDate = addDays(currentDate, 3);
      }

      // Convert to array and sort by date
      dataPoints = Array.from(allPoints.values()).sort((a, b) =>
        a.fullDate.localeCompare(b.fullDate)
      );

      // Ensure the very last point is exactly at endDate for perfect target line
      const lastPoint = dataPoints[dataPoints.length - 1];
      if (lastPoint && lastPoint.fullDate !== format(endDate, 'yyyy-MM-dd')) {
        dataPoints.push({
          date: format(endDate, 'MMM dd'),
          fullDate: format(endDate, 'yyyy-MM-dd'),
          weight: null,
          target: calculateTargetForDate(endDate),
        });
      }

    } else if (viewMode === 'weekly') {
      // Weekly view: Group by week, use last entry of each week
      const weekMap = new Map<string, WeightEntry>();

      sortedEntries.forEach((entry) => {
        const weekStart = startOfWeek(entry.dateObj, { weekStartsOn: 0 }); // Sunday
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        weekMap.set(weekKey, entry); // Last entry wins
      });

      // Generate all weekly points from start to end for straight target line
      const allWeeks = new Set<string>();
      let currentWeek = startOfWeek(startDate, { weekStartsOn: 0 });
      const endWeek = startOfWeek(endDate, { weekStartsOn: 0 });

      // Include all weeks from start to the week containing the end date
      while (currentWeek <= endWeek) {
        allWeeks.add(format(currentWeek, 'yyyy-MM-dd'));
        currentWeek = addDays(currentWeek, 7);
      }

      // Create data points with explicit start and end dates
      const sortedWeeks = Array.from(allWeeks).sort();
      dataPoints = sortedWeeks.map((weekKey, index) => {
        const entry = weekMap.get(weekKey);
        const weekDate = parseISO(weekKey);

        // For first and last points, use exact start/end dates for target calculation
        let targetDate = weekDate;
        if (index === 0) targetDate = startDate;
        if (index === sortedWeeks.length - 1) targetDate = endDate;

        return {
          date: format(weekDate, 'MMM dd'),
          fullDate: index === 0
            ? format(startDate, 'yyyy-MM-dd')
            : index === sortedWeeks.length - 1
              ? format(endDate, 'yyyy-MM-dd')
              : entry?.date || weekKey,
          weight: entry?.weight || null,
          target: calculateTargetForDate(targetDate),
        };
      });

    } else {
      // Monthly view: Group by month, use last entry of each month
      const monthMap = new Map<string, WeightEntry>();

      sortedEntries.forEach((entry) => {
        const monthStart = startOfMonth(entry.dateObj);
        const monthKey = format(monthStart, 'yyyy-MM');
        monthMap.set(monthKey, entry); // Last entry wins
      });

      // Generate all monthly points from start to end for straight target line
      const allMonths = new Set<string>();
      let currentMonth = startOfMonth(startDate);
      const endMonth = startOfMonth(endDate);

      // Include all months from start to the month containing the end date
      while (currentMonth <= endMonth) {
        allMonths.add(format(currentMonth, 'yyyy-MM'));
        currentMonth = new Date(currentMonth);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      // Create data points with explicit start and end dates
      const sortedMonths = Array.from(allMonths).sort();
      dataPoints = sortedMonths.map((monthKey, index) => {
        const entry = monthMap.get(monthKey);
        const monthDate = parseISO(monthKey + '-01');

        // For first and last points, use exact start/end dates for target calculation
        let targetDate = monthDate;
        if (index === 0) targetDate = startDate;
        if (index === sortedMonths.length - 1) targetDate = endDate;

        return {
          date: format(monthDate, 'MMM yyyy'),
          fullDate: index === 0
            ? format(startDate, 'yyyy-MM-dd')
            : index === sortedMonths.length - 1
              ? format(endDate, 'yyyy-MM-dd')
              : entry?.date || format(monthDate, 'yyyy-MM-dd'),
          weight: entry?.weight || null,
          target: calculateTargetForDate(targetDate),
        };
      });
    }

    return dataPoints;
  }, [entries, viewMode, startDate, endDate, calculateTargetForDate]);

  const visibleChartData = useMemo(() => {
    if (!range) return chartData;
    return chartData.slice(range.startIndex, range.endIndex + 1);
  }, [chartData, range]);

  const rangeDates = useMemo(() => {
    if (visibleChartData.length === 0) return null;
    const start = parseDateFlexible(visibleChartData[0].fullDate);
    const end = parseDateFlexible(visibleChartData[visibleChartData.length - 1].fullDate);
    return { start, end };
  }, [visibleChartData]);

  const entriesInRange = useMemo(() => {
    if (!rangeDates?.start || !rangeDates?.end) return entries;
    const start = rangeDates.start;
    const end = rangeDates.end;
    return entries.filter((entry) => {
      const parsed = parseDateFlexible(entry.date);
      if (!parsed) return false;
      return parsed >= start && parsed <= end;
    });
  }, [entries, rangeDates]);

  const rangeLabel = useMemo(() => {
    if (!rangeDates?.start || !rangeDates?.end) return 'Full range';
    return `${format(rangeDates.start, 'MMM dd, yyyy')} - ${format(rangeDates.end, 'MMM dd, yyyy')}`;
  }, [rangeDates]);

  const handleBrushChange = (brush: { startIndex?: number; endIndex?: number } | null) => {
    if (!brush || brush.startIndex === undefined || brush.endIndex === undefined) {
      setRange(null);
      return;
    }
    if (brush.startIndex === 0 && brush.endIndex === chartData.length - 1) {
      setRange(null);
      return;
    }
    setRange({ startIndex: brush.startIndex, endIndex: brush.endIndex });
  };

  const handleResetZoom = () => setRange(null);

  const handleExportPNG = async () => {
    try {
      setIsExportOpen(false);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await exportElementToPNG('timeline-chart-export');
      toast.success('Chart exported as PNG!');
    } catch (error) {
      console.error('Chart PNG export error:', error);
      toast.error('Failed to export chart image');
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExportOpen(false);
      await exportToCSV(entriesInRange, targetData);
      toast.success('Chart data exported as CSV!');
    } catch (error) {
      console.error('Chart CSV export error:', error);
      toast.error('Failed to export chart data');
    }
  };

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const fullDate = parseDateFlexible(data.fullDate);

      // Find previous entry for change calculation
      const currentIndex = visibleChartData.findIndex(d => d.fullDate === data.fullDate);
      const previousData = currentIndex > 0 ? visibleChartData[currentIndex - 1] : null;

      // Calculate weight change
      const weightChange = data.weight && previousData?.weight
        ? data.weight - previousData.weight
        : null;

      // Calculate BMI if weight exists
      const bmi = data.weight ? (data.weight / ((targetData.height / 100) ** 2)) : null;

      // Calculate difference from target
      const targetDiff = data.weight ? data.weight - data.target : null;

      // Count days since start for this entry
      const daysSinceStart = data.weight && fullDate
        ? differenceInDays(fullDate, startDate)
        : null;

      return (
        <div className="bg-[var(--paper-3)] backdrop-blur-sm p-4 rounded-2xl shadow-2xl border-2 border-[color:var(--border-default)] min-w-[220px] animate-in fade-in zoom-in duration-200">
          {/* Date Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[color:var(--border-subtle)]">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {fullDate ? format(fullDate, 'EEE, MMM dd, yyyy') : data.fullDate}
            </p>
            {daysSinceStart !== null && (
              <p className="text-xs text-[var(--ink-muted)]">
                Day {daysSinceStart + 1}
              </p>
            )}
          </div>

          {/* Weight Info */}
          {data.weight ? (
            <div className="space-y-2">
              {/* Actual Weight with Trend */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--ink-muted)]">Actual:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--accent-2)]">
                    {data.weight.toFixed(1)} kg
                  </span>
                  {weightChange !== null && (
                    <span className={`text-xs font-semibold flex items-center ${weightChange < 0
                      ? 'text-[var(--accent-2)]'
                      : weightChange > 0
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--ink-muted)]'
                      }`}>
                      {weightChange < 0 ? '↓' : weightChange > 0 ? '↑' : '→'}
                      {Math.abs(weightChange).toFixed(2)} kg
                    </span>
                  )}
                </div>
              </div>

              {/* Target Weight */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--ink-muted)]">Target:</span>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  {data.target.toFixed(1)} kg
                </span>
              </div>

              {/* Difference from Target */}
              {targetDiff !== null && (
                <div className="flex items-center justify-between pt-1 border-t border-[color:var(--border-subtle)]">
                  <span className="text-xs text-[var(--ink-muted)]">vs Target:</span>
                  <span className={`text-xs font-semibold ${targetDiff < 0
                    ? 'text-[var(--accent-2)]'
                    : 'text-[var(--accent)]'
                    }`}>
                    {targetDiff < 0 ? '✓ ' : ''}{Math.abs(targetDiff).toFixed(1)} kg {
                      targetDiff < 0 ? 'ahead' : 'behind'
                    }
                  </span>
                </div>
              )}

              {/* BMI */}
              {bmi !== null && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[var(--ink-muted)]">BMI:</span>
                  <span className="text-xs font-semibold text-[var(--accent-2)]">
                    {bmi.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Target Line Only */
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--ink-muted)]">Target:</span>
              <span className="text-sm font-semibold text-[var(--accent)]">
                {data.target.toFixed(1)} kg
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const viewModes: { value: ViewMode; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  // Calculate x-axis tick interval based on data length
  const tickInterval = useMemo(() => {
    const dataLength = visibleChartData.length;
    if (viewMode === 'daily') {
      // Show every 3rd or 4th tick in daily view
      return Math.ceil(dataLength / 10);
    } else if (viewMode === 'weekly') {
      // Show every 2nd tick in weekly view
      return Math.ceil(dataLength / 15);
    } else {
      // Show all ticks in monthly view
      return 1;
    }
  }, [visibleChartData.length, viewMode]);

  // Calculate dynamic Y-axis domain based on data
  const yAxisDomain = useMemo(() => {
    const weights = visibleChartData
      .map(d => d.weight)
      .filter((w): w is number => w !== null);

    const targets = visibleChartData.map(d => d.target);
    const allValues = [...weights, ...targets];

    if (allValues.length === 0) {
      return [70, 120];
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    // Add 5% padding above and below
    const padding = (max - min) * 0.1;
    const yMin = Math.floor(min - padding);
    const yMax = Math.ceil(max + padding);

    // Ensure minimum range of 20kg for better visualization
    const range = yMax - yMin;
    if (range < 20) {
      const midpoint = (yMin + yMax) / 2;
      return [Math.floor(midpoint - 10), Math.ceil(midpoint + 10)];
    }

    return [yMin, yMax];
  }, [visibleChartData]);

  // Generate nice ticks for Y-axis
  const yAxisTicks = useMemo(() => {
    const [min, max] = yAxisDomain;
    const range = max - min;
    const step = range > 40 ? 10 : 5;

    const ticks: number[] = [];
    for (let i = Math.ceil(min / step) * step; i <= max; i += step) {
      ticks.push(i);
    }

    return ticks;
  }, [yAxisDomain]);

  return (
    <div className="card-elevated h-full p-6">
      <div id="timeline-chart-export">
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow mb-2">Tracking</div>
              <h2 className="font-display text-2xl font-black text-[var(--ink)]">Weight Timeline</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowTable(prev => !prev)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Table className="w-4 h-4" />
                {showTable ? 'Hide Table' : 'Table View'}
              </button>

              {/* View Mode Selector */}
              <div className="segmented flex gap-2">
                {viewModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`segmented-btn ${viewMode === mode.value ? 'active' : ''}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Export Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>

                <AnimatePresence>
                  {isExportOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--paper-3)] rounded-xl shadow-2xl border border-[color:var(--border-default)] overflow-hidden z-50"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-2 space-y-1">
                          <motion.button
                            onClick={handleExportPNG}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors"
                            whileHover={{ x: 4 }}
                          >
                            <Download className="w-5 h-5 text-[var(--accent-2)]" />
                            <div className="flex-1">
                              <div className="font-medium">Chart PNG</div>
                              <div className="text-xs text-[var(--ink-muted)]">Capture timeline view</div>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors"
                            whileHover={{ x: 4 }}
                          >
                            <FileText className="w-5 h-5 text-[var(--accent)]" />
                            <div className="flex-1">
                              <div className="font-medium">Chart CSV</div>
                              <div className="text-xs text-[var(--ink-muted)]">Export visible entries</div>
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full" style={{ backgroundColor: 'var(--chart-actual)' }} />
              <span className="text-[var(--ink-muted)]">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full border-2 border-dashed" style={{ borderColor: 'var(--chart-target)' }} />
              <span className="text-[var(--ink-muted)]">Target Pace</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="px-3 py-1 rounded-full border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
              Range: {rangeLabel}
            </span>
            {range && (
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 rounded-full border border-[color:var(--border-subtle)] bg-[var(--paper-3)] text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors"
              >
                Reset zoom
              </button>
            )}
            <span>Drag handles to zoom, drag the window to pan.</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              tickLine={false}
              domain={yAxisDomain}
              ticks={yAxisTicks}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target trajectory line (dashed) - MUST be linear for straight line */}
            <Line
              type="linear"
              dataKey="target"
              stroke="var(--chart-target)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--chart-target)' }}
            />

            {/* Actual weight line - connects all actual data points */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--chart-actual)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-actual)', r: 4 }}
              activeDot={{ r: 6, fill: 'var(--chart-actual)' }}
              connectNulls={true}
              isAnimationActive={false}
            />

            {chartData.length > 6 && (
              <Brush
                dataKey="date"
                height={26}
                stroke="var(--chart-axis)"
                fill="var(--paper-2)"
                travellerWidth={12}
                startIndex={range?.startIndex}
                endIndex={range?.endIndex}
                onChange={handleBrushChange}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Milestone markers */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
            <div className="text-sm text-[var(--ink-muted)] mb-1">Starting Weight</div>
            <div className="text-2xl font-bold text-[var(--accent-2)]">{targetData.startWeight} kg</div>
          </div>
          <div className="rounded-2xl p-4 border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
            <div className="text-sm text-[var(--ink-muted)] mb-1">Current Weight</div>
            <div className="text-2xl font-bold text-[var(--accent)]">
              {entries[entries.length - 1].weight} kg
            </div>
          </div>
        </div>
      </div>

      {showTable && (
        <div className="mt-8">
          <div className="mb-3 text-xs text-[var(--ink-muted)]">
            Showing {rangeLabel}
          </div>
          <WeightHistoryTable entries={entriesInRange} />
        </div>
      )}
    </div>
  );
};
