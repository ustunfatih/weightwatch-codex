import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORAGE_KEYS, readString, writeString } from '../services/storage';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user has already dismissed
        const dismissed = readString(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Don't show if dismissed within last 7 days
        if (daysSinceDismissal < 7) {
            return;
        }

        // Listen for beforeinstallprompt event
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after a delay (user has time to explore)
            setTimeout(() => {
                setShowPrompt(true);
            }, 30000); // Show after 30 seconds
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted PWA install');
        } else {
            console.log('User dismissed PWA install');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        writeString(STORAGE_KEYS.PWA_INSTALL_DISMISSED, Date.now().toString());
        setShowPrompt(false);
    };

    if (isInstalled || !showPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[90] pointer-events-none"
                >
                    <div className="bg-[var(--paper-3)] backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-[color:var(--border-default)] p-6 pointer-events-auto">
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 hover:bg-[var(--paper-2)] rounded-full transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4 text-[var(--ink-muted)]" />
                        </button>

                        {/* Content */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-[var(--accent-2)] rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-lg font-bold text-[var(--ink)] mb-1">
                                    Install Weightwatch
                                </h3>
                                <p className="text-sm text-[var(--ink-muted)]">
                                    Add to your home screen for quick access and offline support!
                                </p>
                            </div>
                        </div>

                        {/* Benefits */}
                        <ul className="space-y-2 mb-4 ml-1">
                            <li className="flex items-center gap-2 text-sm text-[var(--ink)]">
                                <Smartphone className="w-4 h-4 text-[var(--accent-2)]" />
                                <span>Works offline</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-[var(--ink)]">
                                <Download className="w-4 h-4 text-[var(--accent-2)]" />
                                <span>Fast loading</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-[var(--ink)]">
                                <Smartphone className="w-4 h-4 text-[var(--accent-2)]" />
                                <span>App-like experience</span>
                            </li>
                        </ul>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <motion.button
                                onClick={handleInstall}
                                className="btn-primary flex-1 px-4 py-3"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Install
                            </motion.button>
                            <motion.button
                                onClick={handleDismiss}
                                className="btn-secondary px-4 py-3"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Not Now
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
