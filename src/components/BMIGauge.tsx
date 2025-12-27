import React from 'react';
import { calculateBMI, getBMICategory, BMI_CATEGORIES } from '../utils/calculations';

interface BMIGaugeProps {
  weight: number;
  height: number;
}

const BMIGaugeComponent: React.FC<BMIGaugeProps> = ({ weight, height }) => {
  const bmi = calculateBMI(weight, height);
  const category = getBMICategory(bmi);

  // Calculate needle rotation based on which category segment the BMI falls into
  // Each category gets equal visual space (36 degrees)
  const segmentAngle = 180 / BMI_CATEGORIES.length; // 36 degrees per category

  // Find which category the BMI falls into
  let categoryIndex = -1;
  for (let i = 0; i < BMI_CATEGORIES.length; i++) {
    const cat = BMI_CATEGORIES[i];
    if (i === BMI_CATEGORIES.length - 1) {
      // Last category
      if (bmi >= cat.min) {
        categoryIndex = i;
        break;
      }
    } else {
      if (bmi >= cat.min && bmi < cat.max) {
        categoryIndex = i;
        break;
      }
    }
  }

  let rotation = 0;
  if (categoryIndex !== -1) {
    const cat = BMI_CATEGORIES[categoryIndex];
    // Position within the category (0 to 1)
    let positionInCategory = 0;
    if (categoryIndex === BMI_CATEGORIES.length - 1) {
      // Last category - cap the position for extreme values
      const effectiveMax = Math.min(bmi, 50); // Cap at BMI 50 for visualization
      positionInCategory = (effectiveMax - cat.min) / (50 - cat.min);
    } else {
      positionInCategory = (bmi - cat.min) / (cat.max - cat.min);
    }
    positionInCategory = Math.min(Math.max(positionInCategory, 0), 1);
    // Calculate rotation: start of category + position within
    rotation = categoryIndex * segmentAngle + positionInCategory * segmentAngle;
  }

  return (
    <div className="card-elevated h-full p-6">
      <div className="eyebrow mb-2">Body Index</div>
      <h2 className="font-display text-2xl font-black text-[var(--ink)] mb-6">Your BMI</h2>

      <div className="relative w-full max-w-xs mx-auto">
        {/* Semicircle Gauge */}
        <svg viewBox="0 0 200 120" className="w-full" aria-label="BMI gauge">
          {/* Background Arc Segments - Equal visual size (36 degrees each) */}
          {BMI_CATEGORIES.map((cat, index) => {
            // Equal arc segments: 180 degrees / 5 categories = 36 degrees each
            const segmentAngle = 180 / BMI_CATEGORIES.length;
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const radius = 80;
            const thickness = 20;
            const cx = 100;
            const cy = 100;

            const x1 = cx - radius * Math.cos(startRad);
            const y1 = cy - radius * Math.sin(startRad);
            const x2 = cx - radius * Math.cos(endRad);
            const y2 = cy - radius * Math.sin(endRad);

            const innerRadius = radius - thickness;
            const x3 = cx - innerRadius * Math.cos(endRad);
            const y3 = cy - innerRadius * Math.sin(endRad);
            const x4 = cx - innerRadius * Math.cos(startRad);
            const y4 = cy - innerRadius * Math.sin(startRad);

            const largeArcFlag = 0; // Always 0 since each segment is 36 degrees

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
                fill={cat.color}
                opacity="0.9"
              />
            );
          })}

          {/* Needle - pointing upward to BMI value */}
          <g transform={`rotate(${rotation} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="30"
              y2="100"
              stroke="var(--ink)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="var(--ink)" />
          </g>

          {/* Labels - matching reference image */}
          <text x="15" y="108" className="fill-[var(--ink-muted)]" fontSize="12" fontWeight="600">10</text>
          <text x="100" y="15" className="fill-[var(--ink-muted)]" fontSize="12" fontWeight="600" textAnchor="middle">28</text>
          <text x="185" y="108" className="fill-[var(--ink-muted)]" fontSize="12" fontWeight="600" textAnchor="end">45</text>
        </svg>

        {/* BMI Value */}
        <div className="text-center mt-4">
          <div className="text-5xl font-bold text-[var(--ink)]">{bmi.toFixed(1)}</div>
          <div
            className="inline-block mt-3 px-6 py-2 rounded-full text-white font-semibold text-sm shadow-lg"
            style={{ backgroundColor: BMI_CATEGORIES.find(c => c.category === category)?.color }}
          >
            {category}
          </div>
        </div>
      </div>

      {/* BMI Categories Legend */}
      <div className="mt-6 space-y-2">
        {BMI_CATEGORIES.map((cat) => (
          <div
            key={cat.category}
            className={`flex items-center justify-between p-2 rounded-xl transition-all ${category === cat.category
                ? 'bg-[var(--paper-2)] border-2 border-[color:var(--border-default)]'
                : 'bg-[var(--paper-3)] border border-transparent'
              }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className={`text-sm ${category === cat.category ? 'font-semibold' : 'font-medium'} text-[var(--ink)]`}>
                {cat.category}
              </span>
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              {cat.min.toFixed(1)} - {cat.max === 100 ? '40+' : cat.max.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* BMI Info */}
      <div className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
        <div className="flex justify-between items-center p-3 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)]">
          <span>Weight</span>
          <span className="font-semibold text-[var(--ink)]">{weight.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)]">
          <span>Height</span>
          <span className="font-semibold text-[var(--ink)]">{height} cm</span>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const BMIGauge = React.memo(BMIGaugeComponent);
