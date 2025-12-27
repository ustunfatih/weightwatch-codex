import { WeightEntry, TargetData } from '../types';
import { differenceInDays, addDays } from 'date-fns';
import { parseDateFlexible } from '../utils/dateUtils';

export interface PredictiveAnalysis {
    projectedGoalDate: Date;
    confidenceLevel: number; // 0-100
    recommendedPace: number; // kg per week
    riskAssessment: 'healthy' | 'moderate' | 'aggressive';
    alternativeScenarios: {
        conservative: { date: Date; weeklyLoss: number };
        recommended: { date: Date; weeklyLoss: number };
        aggressive: { date: Date; weeklyLoss: number };
    };
}

export interface PatternInsight {
    type: 'weekday_pattern' | 'monthly_pattern' | 'plateau' | 'acceleration' | 'volatility';
    description: string;
    confidence: number;
    actionable: string;
    severity?: 'info' | 'warning' | 'success';
}

export interface AnomalyDetection {
    date: string;
    weight: number;
    type: 'spike' | 'drop' | 'data_error';
    severity: 'low' | 'medium' | 'high';
    message: string;
    likelyReason?: string;
}

export interface WeeklySummary {
    weekStart: string;
    weekEnd: string;
    averageWeight: number;
    totalChange: number;
    daysLogged: number;
    performance: 'excellent' | 'good' | 'needs_improvement';
    insights: string[];
    recommendations: string[];
}

type ParsedEntry = WeightEntry & { dateObj: Date };

function getParsedEntries(entries: WeightEntry[]): ParsedEntry[] {
    return entries
        .map((entry) => {
            const dateObj = parseDateFlexible(entry.date);
            if (!dateObj) return null;
            return { ...entry, dateObj };
        })
        .filter((entry): entry is ParsedEntry => Boolean(entry))
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

/**
 * Advanced predictive analytics for goal achievement
 */
export function generatePredictiveAnalysis(
    entries: WeightEntry[],
    targetData: TargetData
): PredictiveAnalysis {
    const sortedEntries = getParsedEntries(entries);
    if (sortedEntries.length === 0) {
        return {
            projectedGoalDate: new Date(),
            confidenceLevel: 0,
            recommendedPace: 0.75,
            riskAssessment: 'moderate',
            alternativeScenarios: {
                conservative: { date: new Date(), weeklyLoss: 0.5 },
                recommended: { date: new Date(), weeklyLoss: 0.75 },
                aggressive: { date: new Date(), weeklyLoss: 1.0 },
            },
        };
    }

    // Calculate current trend (last 14 days weighted more)
    const recentEntries = sortedEntries.slice(-14);
    const avgWeeklyLoss = calculateWeeklyLossRate(recentEntries);

    const currentWeight = sortedEntries[sortedEntries.length - 1].weight;
    const remainingLoss = currentWeight - targetData.endWeight;

    // Conservative: 0.5 kg/week (healthy sustainable rate)
    const conservativeWeeks = remainingLoss / 0.5;
    const conservativeDate = addDays(new Date(), conservativeWeeks * 7);

    // Recommended: 0.75 kg/week (balanced approach)
    const recommendedWeeks = remainingLoss / 0.75;
    const recommendedDate = addDays(new Date(), recommendedWeeks * 7);

    // Aggressive: 1.0 kg/week (maximum healthy rate)
    const aggressiveWeeks = remainingLoss / 1.0;
    const aggressiveDate = addDays(new Date(), aggressiveWeeks * 7);

    // Project based on current trend
    const projectedWeeks = avgWeeklyLoss > 0 ? remainingLoss / avgWeeklyLoss : recommendedWeeks;
    const projectedDate = addDays(new Date(), projectedWeeks * 7);

    // Calculate confidence based on consistency
    const consistency = calculateConsistency(recentEntries);
    const confidenceLevel = Math.min(100, Math.max(20, consistency * 100));

    // Assess risk
    let riskAssessment: 'healthy' | 'moderate' | 'aggressive';
    if (avgWeeklyLoss > 1.2) {
        riskAssessment = 'aggressive';
    } else if (avgWeeklyLoss > 0.8) {
        riskAssessment = 'moderate';
    } else {
        riskAssessment = 'healthy';
    }

    return {
        projectedGoalDate: projectedDate,
        confidenceLevel,
        recommendedPace: 0.75,
        riskAssessment,
        alternativeScenarios: {
            conservative: { date: conservativeDate, weeklyLoss: 0.5 },
            recommended: { date: recommendedDate, weeklyLoss: 0.75 },
            aggressive: { date: aggressiveDate, weeklyLoss: 1.0 },
        },
    };
}

/**
 * Identify patterns in weight loss journey
 */
export function identifyPatterns(entries: WeightEntry[]): PatternInsight[] {
    const insights: PatternInsight[] = [];

    if (entries.length < 14) {
        return insights; // Need minimum data
    }

    const sortedEntries = getParsedEntries(entries);

    // Check for weekday patterns
    const weekdayPattern = analyzeWeekdayPattern(sortedEntries);
    if (weekdayPattern) {
        insights.push(weekdayPattern);
    }

    // Check for plateau
    const plateauDetection = detectPlateau(sortedEntries);
    if (plateauDetection) {
        insights.push(plateauDetection);
    }

    // Check for acceleration
    const accelerationDetection = detectAcceleration(sortedEntries);
    if (accelerationDetection) {
        insights.push(accelerationDetection);
    }

    // Check for volatility
    const volatilityDetection = detectVolatility(sortedEntries);
    if (volatilityDetection) {
        insights.push(volatilityDetection);
    }

    return insights;
}

/**
 * Detect anomalies in weight data
 */
export function detectAnomalies(entries: WeightEntry[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    if (entries.length < 5) return anomalies;

    const sortedEntries = getParsedEntries(entries);

    for (let i = 2; i < sortedEntries.length - 1; i++) {
        const current = sortedEntries[i];
        const previous = sortedEntries.slice(Math.max(0, i - 3), i);
        const avgPrevious = previous.reduce((sum, e) => sum + e.weight, 0) / previous.length;
        const stdDev = calculateStandardDeviation(previous.map(e => e.weight));

        const deviation = Math.abs(current.weight - avgPrevious);

        // Spike detection (sudden increase)
        if (current.weight > avgPrevious + (2.5 * stdDev)) {
            anomalies.push({
                date: current.date,
                weight: current.weight,
                type: 'spike',
                severity: deviation > 3 * stdDev ? 'high' : 'medium',
                message: `Unusual weight increase of ${deviation.toFixed(1)} kg`,
                likelyReason: 'Water retention, high sodium intake, or measurement error',
            });
        }

        // Drop detection (sudden decrease)
        if (current.weight < avgPrevious - (2.5 * stdDev)) {
            anomalies.push({
                date: current.date,
                weight: current.weight,
                type: 'drop',
                severity: deviation > 3 * stdDev ? 'high' : 'medium',
                message: `Unusual weight decrease of ${deviation.toFixed(1)} kg`,
                likelyReason: 'Dehydration, measurement error, or illness',
            });
        }
    }

    return anomalies;
}

/**
 * Generate weekly summary with insights
 */
export function generateWeeklySummary(
    entries: WeightEntry[],
    targetData: TargetData
): WeeklySummary | null {
    const oneWeekAgo = addDays(new Date(), -7);
    const weekEntries = entries.filter((entry) => {
        const dateObj = parseDateFlexible(entry.date);
        return dateObj ? dateObj >= oneWeekAgo : false;
    });

    if (weekEntries.length < 2) return null;

    const sortedWeek = getParsedEntries(weekEntries);
    if (sortedWeek.length < 2) return null;

    const weekStart = sortedWeek[0].date;
    const weekEnd = sortedWeek[sortedWeek.length - 1].date;
    const startWeight = sortedWeek[0].weight;
    const endWeight = sortedWeek[sortedWeek.length - 1].weight;
    const totalChange = startWeight - endWeight;
    const averageWeight = sortedWeek.reduce((sum, e) => sum + e.weight, 0) / sortedWeek.length;

    // Determine performance
    const requiredWeeklyLoss = targetData.totalKg / (targetData.totalDuration / 7);
    let performance: 'excellent' | 'good' | 'needs_improvement';
    if (totalChange >= requiredWeeklyLoss * 1.2) {
        performance = 'excellent';
    } else if (totalChange >= requiredWeeklyLoss * 0.8) {
        performance = 'good';
    } else {
        performance = 'needs_improvement';
    }

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (totalChange > 0) {
        insights.push(`You lost ${totalChange.toFixed(2)} kg this week!`);
    } else if (totalChange < 0) {
        insights.push(`Weight increased by ${Math.abs(totalChange).toFixed(2)} kg this week.`);
    } else {
        insights.push('Your weight remained stable this week.');
    }

    insights.push(`You logged weight ${sortedWeek.length} times this week.`);

    // Recommendations
    if (performance === 'excellent') {
        recommendations.push('Outstanding progress! Keep up the great work.');
        recommendations.push('Make sure you\'re not losing weight too quickly.');
    } else if (performance === 'good') {
        recommendations.push('Solid progress towards your goal!');
        recommendations.push('You\'re on track - stay consistent.');
    } else {
        recommendations.push('Consider reviewing your nutrition and exercise habits.');
        recommendations.push('Track your calories to ensure you\'re in a deficit.');
        recommendations.push('Consistency is key - try logging daily.');
    }

    if (sortedWeek.length < 5) {
        recommendations.push('Try to log your weight more frequently for better tracking.');
    }

    return {
        weekStart,
        weekEnd,
        averageWeight,
        totalChange,
        daysLogged: sortedWeek.length,
        performance,
        insights,
        recommendations,
    };
}

// Helper functions

function calculateWeeklyLossRate(entries: WeightEntry[]): number {
    if (entries.length < 2) return 0;

    const sorted = getParsedEntries(entries);
    if (sorted.length < 2) return 0;

    const daysDiff = differenceInDays(
        sorted[sorted.length - 1].dateObj,
        sorted[0].dateObj
    );

    if (daysDiff === 0) return 0;

    const weightDiff = sorted[0].weight - sorted[sorted.length - 1].weight;
    const weeklyLoss = (weightDiff / daysDiff) * 7;

    return Math.max(0, weeklyLoss); // Don't return negative (weight gain)
}

function calculateConsistency(entries: WeightEntry[]): number {
    if (entries.length < 2) return 0;

    const weights = entries.map(e => e.weight);
    const changes = [];

    for (let i = 1; i < weights.length; i++) {
        changes.push(Math.abs(weights[i] - weights[i - 1]));
    }

    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const stdDev = calculateStandardDeviation(changes);

    // Lower volatility = higher consistency
    return stdDev === 0 ? 1 : Math.max(0, 1 - (stdDev / avgChange));
}

function calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

function analyzeWeekdayPattern(entries: WeightEntry[]): PatternInsight | null {
    const weekdayWeights: { [key: number]: number[] } = {};

    entries.forEach(e => {
        const dateObj = parseDateFlexible(e.date);
        if (!dateObj) return;
        const day = dateObj.getDay();
        if (!weekdayWeights[day]) weekdayWeights[day] = [];
        weekdayWeights[day].push(e.weight);
    });

    // Find day with highest average
    let maxDay = 0;
    let maxAvg = 0;
    Object.entries(weekdayWeights).forEach(([day, weights]) => {
        const avg = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        if (avg > maxAvg) {
            maxAvg = avg;
            maxDay = parseInt(day);
        }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Only report if significant pattern (>0.5kg difference)
    const allWeights = Object.values(weekdayWeights).flat();
    const overallAvg = allWeights.reduce((sum, w) => sum + w, 0) / allWeights.length;

    if (maxAvg - overallAvg > 0.5) {
        return {
            type: 'weekday_pattern',
            description: `Your weight tends to be higher on ${dayNames[maxDay]}s`,
            confidence: 75,
            actionable: 'This is normal - weekend weight fluctuations are common due to diet changes.',
            severity: 'info',
        };
    }

    return null;
}

function detectPlateau(entries: WeightEntry[]): PatternInsight | null {
    const recent = entries.slice(-14); // Last 2 weeks
    if (recent.length < 10) return null;

    const weights = recent.map(e => e.weight);
    const change = weights[0] - weights[weights.length - 1];

    // Plateau if less than 0.3kg change in 2 weeks
    if (Math.abs(change) < 0.3) {
        return {
            type: 'plateau',
            description: 'Your weight has plateaued over the last 2 weeks',
            confidence: 85,
            actionable: 'Consider adjusting your calorie intake or increasing exercise intensity.',
            severity: 'warning',
        };
    }

    return null;
}

function detectAcceleration(entries: WeightEntry[]): PatternInsight | null {
    const recent = entries.slice(-7);
    const previous = entries.slice(-14, -7);

    if (recent.length < 5 || previous.length < 5) return null;

    const recentLoss = calculateWeeklyLossRate(recent);
    const previousLoss = calculateWeeklyLossRate(previous);

    // Acceleration if recent loss is 50% higher
    if (recentLoss > previousLoss * 1.5 && recentLoss > 0.8) {
        return {
            type: 'acceleration',
            description: 'Your weight loss has accelerated recently',
            confidence: 80,
            actionable: 'Great progress! Ensure you\'re not losing weight too quickly (>1kg/week can be unhealthy).',
            severity: recentLoss > 1.2 ? 'warning' : 'success',
        };
    }

    return null;
}

function detectVolatility(entries: WeightEntry[]): PatternInsight | null {
    const recent = entries.slice(-14);
    if (recent.length < 7) return null;

    const weights = recent.map(e => e.weight);
    const changes = [];

    for (let i = 1; i < weights.length; i++) {
        changes.push(Math.abs(weights[i] - weights[i - 1]));
    }

    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;

    // High volatility if average daily change > 0.5kg
    if (avgChange > 0.5) {
        return {
            type: 'volatility',
            description: 'Your weight fluctuates significantly day-to-day',
            confidence: 70,
            actionable: 'Consider weighing at the same time each day and tracking weekly averages instead of daily weights.',
            severity: 'info',
        };
    }

    return null;
}
