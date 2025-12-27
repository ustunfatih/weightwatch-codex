import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Scale, Target, TrendingDown, Trophy, Check } from 'lucide-react';
import { STORAGE_KEYS, readString, writeString, removeKey } from '../services/storage';

interface OnboardingModalProps {
    onComplete: () => void;
}

interface Step {
    id: number;
    title: string;
    description: string;
    icon: ReactNode;
    features: string[];
}

const steps: Step[] = [
    {
        id: 1,
        title: 'Welcome to Weightwatch! 👋',
        description: 'Your personal weight tracking companion',
        icon: <Scale className="w-16 h-16 text-[var(--accent-2)]" />,
        features: [
            'Track your weight daily',
            'Visualize your progress with beautiful charts',
            'Sync with Google Sheets',
        ],
    },
    {
        id: 2,
        title: 'Set Your Goals 🎯',
        description: 'Define your target weight and timeline',
        icon: <Target className="w-16 h-16 text-[var(--accent)]" />,
        features: [
            'Set realistic weight loss goals',
            'Track your progress percentage',
            'Get projections for your target date',
        ],
    },
    {
        id: 3,
        title: 'Track Your Progress 📊',
        description: 'Monitor trends and stay motivated',
        icon: <TrendingDown className="w-16 h-16 text-[var(--accent-3)]" />,
        features: [
            'View moving averages and trends',
            'Get AI-powered insights',
            'Compare your performance over time',
        ],
    },
    {
        id: 4,
        title: 'Unlock Achievements 🏆',
        description: 'Celebrate your milestones',
        icon: <Trophy className="w-16 h-16 text-[var(--accent)]" />,
        features: [
            'Earn badges for reaching goals',
            'Track your longest streaks',
            'Share your progress with friends',
        ],
    },
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if onboarding has been completed
        const completed = readString(STORAGE_KEYS.ONBOARDING_COMPLETED);
        if (!completed) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        writeString(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
        setIsVisible(false);
        onComplete();
    };

    const handleSkip = () => {
        writeString(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="relative w-full max-w-2xl bg-[var(--paper-3)] rounded-3xl shadow-2xl overflow-hidden border border-[color:var(--border-default)]"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 hover:bg-[var(--paper-2)] rounded-full transition-colors z-10"
                        aria-label="Skip onboarding"
                    >
                        <X className="w-5 h-5 text-[var(--ink-muted)]" />
                    </button>

                    {/* Progress Indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border-subtle)]">
                        <motion.div
                            className="h-full bg-[var(--accent-2)]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 rounded-full bg-[var(--paper-2)] border border-[color:var(--border-subtle)]">
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-3xl font-bold text-[var(--ink)] mb-3">
                                    {step.title}
                                </h2>

                                {/* Description */}
                                <p className="text-lg text-[var(--ink-muted)] mb-8">
                                    {step.description}
                                </p>

                                {/* Features */}
                                <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
                                    {step.features.map((feature, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 + 0.2 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--paper-2)] border border-[color:var(--border-subtle)]"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(61,90,128,0.2)] flex items-center justify-center">
                                                <Check className="w-4 h-4 text-[var(--accent-2)]" />
                                            </div>
                                            <span className="text-[var(--ink)]">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${currentStep === 0
                                    ? 'opacity-0 pointer-events-none'
                                    : 'bg-[var(--paper-2)] text-[var(--ink-muted)] hover:bg-[var(--paper-3)]'
                                    }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            <div className="flex gap-2">
                                {steps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 rounded-full transition-all ${index === currentStep
                                            ? 'w-8 bg-[var(--accent-2)]'
                                            : 'w-2 bg-[var(--border-subtle)]'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="btn-primary flex items-center gap-2 px-6 py-3"
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>
                                        Get Started
                                        <Check className="w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

    useEffect(() => {
        const completed = readString(STORAGE_KEYS.ONBOARDING_COMPLETED);
        setShouldShowOnboarding(!completed);
    }, []);

    const resetOnboarding = () => {
        removeKey(STORAGE_KEYS.ONBOARDING_COMPLETED);
        setShouldShowOnboarding(true);
    };

    return {
        shouldShowOnboarding,
        resetOnboarding,
    };
}
