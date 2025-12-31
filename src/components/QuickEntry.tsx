import { FormEvent, useState } from 'react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import { WeightEntry } from '../types';
import { VoiceInput } from './VoiceInput';

interface QuickEntryProps {
  onSubmit: (entry: Partial<WeightEntry>) => void;
  onOpenFullForm: () => void;
  isOnline: boolean;
}

export const QuickEntry = ({ onSubmit, onOpenFullForm, isOnline }: QuickEntryProps) => {
  const [weight, setWeight] = useState('');
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const weightNum = parseFloat(weight);

    if (!weight) {
      setError('Weight is required');
      return;
    }

    if (Number.isNaN(weightNum)) {
      setError('Weight must be a number');
      return;
    }

    if (weightNum < 40 || weightNum > 200) {
      setError('Weight must be between 40 and 200 kg');
      return;
    }

    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');

    onSubmit({
      date,
      weight: weightNum,
      weekDay: format(now, 'EEEE'),
      recordedAt: `${date}T${time}`,
    });

    setError(null);
    setWeight('');
    setTime(format(new Date(), 'HH:mm'));
  };

  return (
    <div className="card-elevated p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="eyebrow mb-1">Quick Entry</div>
          <h3 className="font-display text-xl font-black text-[var(--ink)]">
            Log today&apos;s weight
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Save instantly or open the full form for edits.
          </p>
        </div>
        {!isOnline && (
          <div className="px-2.5 py-1 rounded-full bg-[rgba(224,122,95,0.15)] text-[var(--accent)] text-xs font-semibold border border-[color:var(--accent)]">
            Offline
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-2">
            Weight (kg)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="40"
              max="200"
              placeholder="e.g., 75.5"
              className={`flex-1 px-4 py-3 rounded-xl border ${error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-[color:var(--border-subtle)] focus:ring-[color:var(--accent)]'
                } bg-[var(--paper-3)] text-[var(--ink)] focus:outline-none focus:ring-2 transition-all`}
            />
            <VoiceInput onWeightDetected={(detectedWeight) => setWeight(detectedWeight.toString())} />
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-[120px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] bg-[var(--paper-3)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all"
          />
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenFullForm}
          className="text-xs text-[var(--ink-muted)] underline underline-offset-4"
        >
          Open full entry form
        </button>
      </form>
    </div>
  );
};
