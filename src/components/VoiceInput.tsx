import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
    onWeightDetected: (weight: number) => void;
}

export function VoiceInput({ onWeightDetected }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Check if browser supports Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);

            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                console.log('Voice input:', transcript);

                // Try to extract weight from transcript
                const weight = extractWeight(transcript);

                if (weight) {
                    onWeightDetected(weight);
                    toast.success(`Weight detected: ${weight} kg`);
                } else {
                    toast.error('Could not understand weight. Please try again.');
                }

                setIsListening(false);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                if (event.error === 'no-speech') {
                    toast.error('No speech detected. Please try again.');
                } else if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied. Please enable it in your browser settings.');
                } else {
                    toast.error('Voice input error. Please try again.');
                }
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } else {
            setIsSupported(false);
        }

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);

    const startListening = () => {
        if (recognition && !isListening) {
            try {
                recognition.start();
                setIsListening(true);
                toast('🎤 Listening... Say your weight (e.g., "95.5 kilograms" or "95.5 kg")');
            } catch (error) {
                console.error('Error starting recognition:', error);
                toast.error('Could not start voice input. Please try again.');
            }
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    };

    if (!isSupported) {
        return null; // Don't render if not supported
    }

    return (
        <motion.button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-3 rounded-xl transition-all ${isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink-muted)] border border-[color:var(--border-subtle)]'
                }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop listening' : 'Use voice to enter weight'}
        >
            {isListening ? (
                <MicOff className="w-5 h-5" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
        </motion.button>
    );
}

// Extract weight from voice transcript
function extractWeight(transcript: string): number | null {
    // Remove common words
    let cleaned = transcript
        .replace(/kilograms?|kgs?|pounds?|lbs?/gi, '')
        .replace(/point/gi, '.')
        .replace(/my weight is|i weigh|weight|is/gi, '')
        .trim();

    // Try to find a number
    const matches = cleaned.match(/(\d+\.?\d*)/);

    if (matches && matches[1]) {
        const weight = parseFloat(matches[1]);

        // Validate weight range (40-200 kg is reasonable)
        if (weight >= 40 && weight <= 200) {
            return weight;
        }
    }

    // Try alternative patterns could be added here for better accuracy

    return null;
}
