import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, Lightbulb, ArrowLeft, Activity } from 'lucide-react';
import { WeightEntry, TargetData, Statistics } from '../types';
import {
    calculateMovingAverages,
    analyzeTrend,
    filterByDateRange,
    getDateRangePresets,
    comparePerformance,
    generateInsights,
    DateRangeFilter,
    calculateVolatilityStats,
    calculateWeeklyDeltas,
    calculateConsistencyStats,
    calculateTimeOfDayStats,
    detectChangePoint,
} from '../services/analyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { staggerContainer, staggerItem } from '../utils/animations';
import { AIInsights } from './AIInsights';
import { HeatMapCalendar } from './HeatMapCalendar';

interface TrendsPageProps {
    entries: WeightEntry[];
    targetData: TargetData;
    stats: Statistics;
    onClose: () => void;
}

export function TrendsPage({ entries, targetData, stats, onClose }: TrendsPageProps) {
    const latestDate = entries.length > 0 ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0];
    const presets = getDateRangePresets(latestDate);

    const [selectedRange, setSelectedRange] = useState<string>('Last 30 Days');
    const [customRange, setCustomRange] = useState<DateRangeFilter>(presets['Last 30 Days']);

    const filteredEntries = useMemo(() => {
        return filterByDateRange(entries, customRange);
    }, [entries, customRange]);

    const movingAverages = useMemo(() => {
        return calculateMovingAverages(filteredEntries);
    }, [filteredEntries]);

    const trendAnalysis = useMemo(() => {
        return analyzeTrend(entries);
    }, [entries]);

    const insights = useMemo(() => {
        return generateInsights(entries, targetData);
    }, [entries, targetData]);

    const volatilityStats = useMemo(() => calculateVolatilityStats(filteredEntries), [filteredEntries]);
    const weeklyDeltas = useMemo(() => calculateWeeklyDeltas(filteredEntries), [filteredEntries]);
    const consistencyStats = useMemo(() => calculateConsistencyStats(entries, targetData.startDate), [entries, targetData.startDate]);
    const timeOfDayStats = useMemo(() => calculateTimeOfDayStats(entries), [entries]);
    const changePoint = useMemo(() => detectChangePoint(entries), [entries]);

    const handleRangeChange = (preset: string) => {
        setSelectedRange(preset);
        setCustomRange(presets[preset]);
    };

    // Prepare data for comparison
    const comparisonData = useMemo(() => {
        const currentPeriodDays = 30;
        const currentPeriod = entries.slice(-currentPeriodDays);
        const previousPeriod = entries.slice(-currentPeriodDays * 2, -currentPeriodDays);

        if (previousPeriod.length === 0) return null;

        return comparePerformance(currentPeriod, previousPeriod);
    }, [entries]);

    // Format chart data
    const chartData = movingAverages.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Actual Weight': parseFloat(item.weight.toFixed(1)),
        '7-Day Average': parseFloat(item.ma7.toFixed(1)),
        '14-Day Average': parseFloat(item.ma14.toFixed(1)),
        '30-Day Average': parseFloat(item.ma30.toFixed(1)),
    }));

    const weeklyDeltaData = weeklyDeltas.map(item => ({
        week: item.label,
        change: parseFloat(item.changeKg.toFixed(2)),
    }));

    return (
        <motion.div
            className="fixed inset-0 z-[70] bg-[var(--paper)] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="sticky top-0 z-10 masthead">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="icon-btn"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-6 h-6 text-[var(--ink-muted)]" />
                            </button>
                            <h1 className="text-2xl font-bold text-[var(--ink)] flex items-center gap-2">
                                <TrendingUp className="w-7 h-7 text-[var(--accent-2)]" />
                                Advanced Analytics
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <motion.main
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {/* Date Range Selector */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-[var(--accent-2)]" />
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Date Range</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(presets).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handleRangeChange(preset)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedRange === preset
                                        ? 'bg-[var(--ink)] text-[var(--paper-3)] shadow-lg'
                                        : 'bg-[var(--paper-2)] text-[var(--ink-muted)] hover:bg-[var(--paper-3)]'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Trend Analysis Card */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[rgba(61,90,128,0.12)] flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[var(--accent-2)]" />
                            </div>
                            <h2 className="font-display text-xl font-black text-[var(--ink)] uppercase tracking-tight">Trend Analysis</h2>
                        </div>
                        <div className="flex items-start gap-6">
                            <div className={`p-5 rounded-3xl transform rotate-2 shadow-lg border border-[color:var(--border-subtle)] ${trendAnalysis.trend === 'accelerating' ? 'bg-[rgba(61,90,128,0.18)]' :
                                trendAnalysis.trend === 'steady' ? 'bg-[rgba(242,204,143,0.2)]' :
                                    trendAnalysis.trend === 'slowing' ? 'bg-[rgba(224,122,95,0.18)]' :
                                        'bg-[rgba(181,90,74,0.2)]'
                                }`}>
                                <div className="text-4xl filter drop-shadow-md">
                                    {trendAnalysis.trend === 'accelerating' ? '🚀' :
                                        trendAnalysis.trend === 'steady' ? '📊' :
                                            trendAnalysis.trend === 'slowing' ? '⚠️' : '🎯'}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[var(--ink)] capitalize mb-1">
                                    {trendAnalysis.trend}
                                </h3>
                                <p className="text-[var(--ink-muted)] text-sm">
                                    {trendAnalysis.message}
                                </p>
                                <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-[var(--ink-muted)]">Confidence</div>
                                        <div className="flex-1 h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--accent-2)]"
                                                style={{ width: `${trendAnalysis.confidence * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-xs font-semibold text-[var(--ink)]">
                                            {(trendAnalysis.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Moving Averages Chart */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-[var(--accent-2)]" />
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Moving Averages</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--chart-axis)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="var(--chart-axis)"
                                    style={{ fontSize: '12px' }}
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--paper-3)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '12px',
                                        color: 'var(--ink)',
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Actual Weight"
                                    stroke="var(--chart-actual)"
                                    strokeWidth={2}
                                    dot={{ fill: 'var(--chart-actual)', r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="7-Day Average"
                                    stroke="var(--accent-2)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="14-Day Average"
                                    stroke="var(--accent-3)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="30-Day Average"
                                    stroke="var(--accent)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.section>

                {/* Weekly Momentum */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-[var(--accent-2)]" />
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Weekly Momentum</h2>
                            <span className="text-sm text-[var(--ink-muted)]">(kg change per week)</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={weeklyDeltaData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis dataKey="week" stroke="var(--chart-axis)" style={{ fontSize: '12px' }} />
                                <YAxis stroke="var(--chart-axis)" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--paper-3)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '12px',
                                        color: 'var(--ink)',
                                    }}
                                />
                                <Bar dataKey="change" fill="var(--accent-2)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.section>

                {/* Consistency + Volatility */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card-elevated p-5">
                            <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-2">Consistency</div>
                            <div className="text-3xl font-bold text-[var(--ink)]">
                                {consistencyStats.consistencyPercent.toFixed(0)}%
                            </div>
                            <div className="text-sm text-[var(--ink-muted)] mt-2">
                                {consistencyStats.trackedDays}/{consistencyStats.totalDays} days tracked
                            </div>
                        </div>
                        <div className="card-elevated p-5">
                            <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-2">Volatility</div>
                            <div className="text-3xl font-bold text-[var(--ink)]">
                                {volatilityStats.stdDevDailyChange.toFixed(2)} kg
                            </div>
                            <div className="text-sm text-[var(--ink-muted)] mt-2">
                                Avg daily change {volatilityStats.averageDailyChange.toFixed(2)} kg
                            </div>
                        </div>
                        <div className="card-elevated p-5">
                            <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-2">Longest Gap</div>
                            <div className="text-3xl font-bold text-[var(--ink)]">
                                {consistencyStats.longestGap} days
                            </div>
                            <div className="text-sm text-[var(--ink-muted)] mt-2">
                                Aim for fewer than 2 days between logs
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Time-of-Day Pattern */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-[var(--accent-2)]" />
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Time of Day Pattern</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {([
                                { label: 'Morning', value: timeOfDayStats.morningAvg },
                                { label: 'Afternoon', value: timeOfDayStats.afternoonAvg },
                                { label: 'Evening', value: timeOfDayStats.eveningAvg },
                                { label: 'Night', value: timeOfDayStats.nightAvg },
                            ]).map((slot) => (
                                <div key={slot.label} className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)] p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-1">{slot.label}</div>
                                    <div className="text-xl font-bold text-[var(--ink)]">
                                        {slot.value ? `${slot.value.toFixed(1)} kg` : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-sm text-[var(--ink-muted)]">
                            Dominant period: <span className="font-semibold text-[var(--ink)]">{timeOfDayStats.dominantPeriod}</span>
                        </div>
                    </div>
                </motion.section>

                {/* Performance Comparison */}
                {comparisonData && (
                    <motion.section variants={staggerItem} className="mb-8">
                        <div className="card-elevated p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-[var(--accent-2)]" />
                                <h2 className="text-lg font-semibold text-[var(--ink)]">Performance Comparison</h2>
                                <span className="text-sm text-[var(--ink-muted)]">(Last 30 days vs Previous 30 days)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {comparisonData.map((metric) => (
                                    <div
                                        key={metric.name}
                                        className="p-4 rounded-2xl bg-[var(--paper-2)] border border-[color:var(--border-subtle)]"
                                    >
                                        <div className="text-sm text-[var(--ink-muted)] mb-2">{metric.name}</div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <div className="text-2xl font-bold text-[var(--ink)]">
                                                {metric.current.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-[var(--ink-muted)]">{metric.unit}</div>
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm ${metric.changePercent > 0 ? 'text-[var(--accent-2)]' :
                                            metric.changePercent < 0 ? 'text-[var(--accent)]' :
                                                'text-[var(--ink-muted)]'
                                            }`}>
                                            <span>{metric.changePercent > 0 ? '↑' : metric.changePercent < 0 ? '↓' : '→'}</span>
                                            <span>{Math.abs(metric.changePercent).toFixed(1)}% vs previous period</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* AI-Powered Insights */}
                <motion.section variants={staggerItem} className="mb-8">
                    <div className="card-elevated p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-[var(--accent-2)]" />
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Insights & Recommendations</h2>
                        </div>
                        <div className="space-y-3">
                            {insights.map((insight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 rounded-xl bg-[rgba(61,90,128,0.12)] border border-[color:var(--accent-2)]"
                                >
                                    <p className="text-[var(--ink)]">{insight}</p>
                                </motion.div>
                            ))}
                        </div>
                        {changePoint && (
                            <div className="mt-4 rounded-xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)] p-4 text-sm text-[var(--ink)]">
                                <strong>Change point:</strong> {changePoint.window} ({changePoint.direction}, {changePoint.delta.toFixed(2)} kg/day)
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* AI Insights */}
                <motion.section variants={staggerItem} className="mb-8">
                    <AIInsights entries={entries} targetData={targetData} stats={stats} />
                </motion.section>

                {/* Consistency Heatmap */}
                <motion.section variants={staggerItem} className="mb-8">
                    <HeatMapCalendar entries={entries} startDate={targetData.startDate} />
                </motion.section>
            </motion.main>
        </motion.div>
    );
}
