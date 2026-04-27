import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface IndicatorGaugeProps {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  zones?: { from: number; to: number; color: string; label: string }[];
  size?: number;
}

const defaultZones = [
  { from: 0, to: 30, color: '#10B981', label: 'Oversold' },
  { from: 30, to: 70, color: '#F59E0B', label: 'Neutral' },
  { from: 70, to: 100, color: '#EF4444', label: 'Overbought' },
];

export const IndicatorGauge = ({
  label,
  value,
  min = 0,
  max = 100,
  zones = defaultZones,
  size = 120,
}: IndicatorGaugeProps) => {
  const range = max - min;
  const normalizedValue = value != null ? Math.max(min, Math.min(max, value)) : min;
  const percentage = range > 0 ? ((normalizedValue - min) / range) * 100 : 0;
  // Arc goes from 135° to 405° (270° sweep)
  const sweepAngle = 270;
  const startAngle = 135;
  const angle = startAngle + (percentage / 100) * sweepAngle;

  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const describeArc = (startA: number, endA: number) => {
    const s = (startA * Math.PI) / 180;
    const e = (endA * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle endpoint
  const needleAngle = (angle * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const activeZone = zones.find(z => normalizedValue >= z.from && normalizedValue < z.to) || zones[zones.length - 1];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.85}`}>
        {/* Background arc */}
        <path d={describeArc(startAngle, startAngle + sweepAngle)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} strokeLinecap="round" />
        {/* Zone arcs */}
        {zones.map((zone, i) => {
          const zStart = startAngle + ((zone.from - min) / range) * sweepAngle;
          const zEnd = startAngle + ((zone.to - min) / range) * sweepAngle;
          return (
            <path key={i} d={describeArc(zStart, zEnd)} fill="none" stroke={zone.color} strokeWidth={8} strokeLinecap="round" opacity={0.25} />
          );
        })}
        {/* Active fill */}
        {value != null && (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            d={describeArc(startAngle, angle)}
            fill="none"
            stroke={activeZone.color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        {value != null && (
          <motion.line
            initial={{ x2: cx, y2: cy }}
            animate={{ x2: nx, y2: ny }}
            transition={{ duration: 1, ease: 'easeOut' }}
            x1={cx} y1={cy}
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="white" />
        {/* Value text */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize={16} fontWeight="800" fill="white">
          {value != null ? value.toFixed(1) : '—'}
        </text>
      </svg>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: activeZone.color }}>{activeZone.label}</div>
      </div>
    </div>
  );
};
