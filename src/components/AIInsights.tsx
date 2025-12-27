import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle2, Calendar, Target } from 'lucide-react';
import { WeightEntry, TargetData, Statistics } from '../types';
import {
    generatePredictiveAnalysis,
    identifyPatterns,
    detectAnomalies,
    generateWeeklySummary
} from '../services/aiAnalyticsService';
import { format } from 'date-fns';
import { parseDateFlexible } from '../utils/dateUtils';

interface AIInsightsProps {
    entries: WeightEntry[];
    targetData: TargetData;
    stats: Statistics;
}

export function AIInsights({ entries, targetData }: AIInsightsProps) {
    const predictions = useMemo(() =>
        generatePredictiveAnalysis(entries, targetData),
        [entries, targetData]
    );

    const patterns = useMemo(() =>
        identifyPatterns(entries),
        [entries]
    );

    const anomalies = useMemo(() =>
        detectAnomalies(entries).slice(0, 3), // Show last 3
        [entries]
    );

    const weeklySummary = useMemo(() =>
        generateWeeklySummary(entries, targetData),
        [entries, targetData]
    );

    // Risk color coding
    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'healthy': return 'text-[var(--accent-2)] bg-[rgba(61,90,128,0.12)] border-[color:var(--accent-2)]';
            case 'moderate': return 'text-[var(--accent)] bg-[rgba(224,122,95,0.12)] border-[color:var(--accent)]';
            case 'aggressive': return 'text-[#b55a4a] bg-[rgba(181,90,74,0.12)] border-[#b55a4a]';
            default: return 'text-[var(--ink-muted)] bg-[var(--paper-2)] border-[color:var(--border-subtle)]';
        }
    };

    const getPerformanceColor = (perf: string) => {
        switch (perf) {
            case 'excellent': return 'bg-[var(--accent-2)]';
            case 'good': return 'bg-[var(--accent-3)]';
            case 'needs_improvement': return 'bg-[var(--accent)]';
            default: return 'bg-[var(--paper-2)]';
        }
    };

    return (
        <div className="space-y-6">
            {/* Predictive Analysis */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-6"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[var(--accent-2)] rounded-full flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-black text-[var(--ink)]">AI Goal Prediction</h3>
                        <p className="text-sm text-[var(--ink-muted)]">Based on your current progress</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Main Prediction */}
                    <div className="p-4 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)]">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm text-[var(--ink-muted)]">Projected Goal Date</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">
                                    {format(predictions.projectedGoalDate, 'MMM dd, yyyy')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[var(--ink-muted)]">Confidence</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">
                                    {predictions.confidenceLevel.toFixed(0)}%
                                </p>
                            </div>
                        </div>

                        {/* Confidence Bar */}
                        <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-3">
                            <div
                                className="h-full bg-[var(--accent-2)] transition-all duration-1000"
                                style={{ width: `${predictions.confidenceLevel}%` }}
                            />
                        </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className={`p-4 rounded-xl border ${getRiskColor(predictions.riskAssessment)}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {predictions.riskAssessment === 'healthy' && <CheckCircle2 className="w-5 h-5" />}
                            {predictions.riskAssessment === 'moderate' && <Info className="w-5 h-5" />}
                            {predictions.riskAssessment === 'aggressive' && <AlertTriangle className="w-5 h-5" />}
                            <span className="font-semibold text-sm">
                                {predictions.riskAssessment === 'healthy' && 'Healthy Pace'}
                                {predictions.riskAssessment === 'moderate' && 'Moderate Pace'}
                                {predictions.riskAssessment === 'aggressive' && 'Aggressive Pace'}
                            </span>
                        </div>
                        <p className="text-xs">
                            {predictions.riskAssessment === 'healthy' && 'Your current weight loss rate is sustainable and healthy.'}
                            {predictions.riskAssessment === 'moderate' && 'You\'re losing weight at a good pace. Monitor for any signs of fatigue.'}
                            {predictions.riskAssessment === 'aggressive' && 'You\'re losing weight quickly. Ensure you\'re eating enough and consult a healthcare professional if concerned.'}
                        </p>
                    </div>

                    {/* Alternative Scenarios */}
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(predictions.alternativeScenarios).map(([key, scenario]) => (
                            <div
                                key={key}
                                className="p-3 bg-[var(--paper-2)] rounded-xl text-center border border-[color:var(--border-subtle)]"
                            >
                                <p className="text-xs text-[var(--ink-muted)] mb-1 capitalize">{key}</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">
                                    {format(scenario.date, 'MMM dd')}
                                </p>
                                <p className="text-xs text-[var(--ink-muted)]">
                                    {scenario.weeklyLoss} kg/wk
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Weekly Summary */}
            {weeklySummary && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card-elevated p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 ${getPerformanceColor(weeklySummary.performance)} rounded-full flex items-center justify-center`}>
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-black text-[var(--ink)]">This Week's Summary</h3>
                            <p className="text-sm text-[var(--ink-muted)]">
                                    {format(parseDateFlexible(weeklySummary.weekStart) ?? new Date(weeklySummary.weekStart), 'MMM dd')} - {format(parseDateFlexible(weeklySummary.weekEnd) ?? new Date(weeklySummary.weekEnd), 'MMM dd')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Performance Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getPerformanceColor(weeklySummary.performance)} text-white font-semibold text-sm`}>
                            {weeklySummary.performance === 'excellent' && <TrendingUp className="w-4 h-4" />}
                            {weeklySummary.performance === 'good' && <CheckCircle2 className="w-4 h-4" />}
                            {weeklySummary.performance === 'needs_improvement' && <TrendingDown className="w-4 h-4" />}
                            <span className="capitalize">{weeklySummary.performance.replace('_', ' ')}</span>
                        </div>

                        {/* Insights */}
                        <div className="space-y-2">
                            {weeklySummary.insights.map((insight, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-[var(--ink)]">
                                    <Info className="w-4 h-4 text-[var(--accent-2)] flex-shrink-0 mt-0.5" />
                                    <p>{insight}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recommendations */}
                        <div className="p-3 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)]">
                            <p className="text-xs font-semibold text-[var(--accent-2)] mb-2">Recommendations</p>
                            <ul className="space-y-1">
                                {weeklySummary.recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs text-[var(--ink-muted)] flex items-start gap-2">
                                        <span className="text-[var(--accent-2)]">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Pattern Insights */}
            {patterns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card-elevated p-6"
                >
                    <h3 className="font-display text-lg font-black text-[var(--ink)] mb-4">Pattern Analysis</h3>
                    <div className="space-y-3">
                        {patterns.map((pattern, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${pattern.severity === 'success' ? 'bg-[rgba(61,90,128,0.12)] border-[color:var(--accent-2)]' :
                                    pattern.severity === 'warning' ? 'bg-[rgba(224,122,95,0.12)] border-[color:var(--accent)]' :
                                        'bg-[rgba(242,204,143,0.14)] border-[color:var(--accent-3)]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pattern.severity === 'success' ? 'bg-[var(--accent-2)]' :
                                        pattern.severity === 'warning' ? 'bg-[var(--accent)]' :
                                            'bg-[var(--accent-3)]'
                                        }`}>
                                        {pattern.type === 'plateau' && <TrendingDown className="w-5 h-5 text-white" />}
                                        {pattern.type === 'acceleration' && <TrendingUp className="w-5 h-5 text-white" />}
                                        {pattern.type.includes('pattern') && <Info className="w-5 h-5 text-white" />}
                                        {pattern.type === 'volatility' && <AlertTriangle className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-[var(--ink)] mb-1">
                                            {pattern.description}
                                        </p>
                                        <p className="text-xs text-[var(--ink-muted)] mb-2">
                                            {pattern.actionable}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--accent-2)]"
                                                    style={{ width: `${pattern.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-[var(--ink-muted)] whitespace-nowrap">
                                                {pattern.confidence}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Anomalies */}
            {anomalies.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-elevated p-6"
                >
                    <h3 className="font-display text-lg font-black text-[var(--ink)] mb-4">Recent Anomalies</h3>
                    <div className="space-y-3">
                        {anomalies.map((anomaly, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${anomaly.severity === 'high' ? 'bg-[rgba(181,90,74,0.12)] border-[#b55a4a]' :
                                    anomaly.severity === 'medium' ? 'bg-[rgba(224,122,95,0.12)] border-[color:var(--accent)]' :
                                        'bg-[rgba(242,204,143,0.14)] border-[color:var(--accent-3)]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${anomaly.severity === 'high' ? 'text-[#b55a4a]' :
                                        anomaly.severity === 'medium' ? 'text-[var(--accent)]' :
                                            'text-[var(--accent-3)]'
                                        }`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-sm text-[var(--ink)]">
                                                {format(parseDateFlexible(anomaly.date) ?? new Date(anomaly.date), 'MMM dd, yyyy')}
                                            </p>
                                            <span className="text-sm font-semibold text-[var(--ink)]">
                                                {anomaly.weight.toFixed(1)} kg
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--ink-muted)] mb-1">
                                            {anomaly.message}
                                        </p>
                                        {anomaly.likelyReason && (
                                            <p className="text-xs text-[var(--ink-muted)]">
                                                Possible cause: {anomaly.likelyReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
