import React, { useMemo } from 'react';
import { Activity, ArrowDown, ArrowUp, BarChart3, Minus, TrendingUp, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { IndicatorGauge } from './IndicatorGauge';
import { computeSignal, type Signal, type SignalResult } from '../../lib/advancedAnalysis';
import { motion } from 'motion/react';

type KlineCandle = { t: number; open: number; high: number; low: number; close: number; volume: number };

interface TrendAnalysisPanelProps {
  candles: KlineCandle[];
  symbol: string;
}

const SIGNAL_COLORS: Record<Signal, { bg: string; text: string; border: string; glow: string }> = {
  STRONG_BUY: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
  BUY: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: '' },
  HOLD: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: '' },
  SELL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: '' },
  STRONG_SELL: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
};

const SignalIcon = ({ signal }: { signal: Signal }) => {
  if (signal.includes('BUY')) return <ArrowUp className="w-5 h-5" />;
  if (signal.includes('SELL')) return <ArrowDown className="w-5 h-5" />;
  return <Minus className="w-5 h-5" />;
};

export const TrendAnalysisPanel = ({ candles, symbol }: TrendAnalysisPanelProps) => {
  const analysis = useMemo<SignalResult | null>(() => {
    if (candles.length < 50) return null;
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    return computeSignal(closes, highs, lows, volumes);
  }, [candles]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 font-bold">
        <Activity className="w-6 h-6 mr-2 opacity-30" />
        Insufficient data for analysis (need 50+ candles)
      </div>
    );
  }

  const sc = SIGNAL_COLORS[analysis.signal];
  const details = analysis.details;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-hide">
      {/* Main Signal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("rounded-2xl border p-6 text-center relative overflow-hidden", sc.bg, sc.border, sc.glow)}
      >
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="relative z-10">
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 mb-2">Composite Signal • {symbol}</div>
          <div className={cn("text-4xl font-black tracking-tight mb-2", sc.text)}>
            <SignalIcon signal={analysis.signal} />
            <span className="ml-2">{analysis.signal.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-sm font-bold text-white/60">Confidence</div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn("h-full rounded-full", sc.bg.replace('/10', '').replace('/20', ''))}
                style={{ backgroundColor: sc.text.includes('emerald') ? '#10B981' : sc.text.includes('rose') ? '#EF4444' : '#F59E0B' }}
              />
            </div>
            <span className={cn("text-sm font-extrabold", sc.text)}>{analysis.confidence}%</span>
          </div>
        </div>
      </motion.div>

      {/* Indicator Gauges */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex items-center justify-center border-white/5">
          <IndicatorGauge label="RSI (14)" value={details.rsi.value} />
        </GlassCard>
        <GlassCard className="p-4 flex items-center justify-center border-white/5">
          <IndicatorGauge
            label="Stoch RSI"
            value={details.stochRSI.value}
            zones={[
              { from: 0, to: 20, color: '#10B981', label: 'Oversold' },
              { from: 20, to: 80, color: '#6366F1', label: 'Neutral' },
              { from: 80, to: 100, color: '#EF4444', label: 'Overbought' },
            ]}
          />
        </GlassCard>
      </div>

      {/* Detailed Signals Grid */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 px-1">Indicator Breakdown</div>
        {[
          { name: 'RSI', ...details.rsi, display: details.rsi.value?.toFixed(1) || '—' },
          { name: 'MACD Hist', ...details.macd, display: details.macd.value?.toFixed(4) || '—' },
          { name: 'Bollinger', signal: details.bollinger.signal, display: details.bollinger.position.replace(/_/g, ' ') },
          { name: 'Stoch RSI', ...details.stochRSI, display: details.stochRSI.value?.toFixed(1) || '—' },
          { name: 'EMA Trend', signal: details.trend.signal, display: details.trend.direction },
          { name: 'Volume', signal: details.volume.signal, display: details.volume.trend },
        ].map((item, i) => {
          const color = SIGNAL_COLORS[item.signal];
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", color.bg.replace('/10', '').replace('/20', ''))} style={{ backgroundColor: color.text.includes('emerald') ? '#10B981' : color.text.includes('rose') ? '#EF4444' : '#F59E0B' }} />
                <span className="text-xs font-bold text-white/80">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-white/50 capitalize">{item.display}</span>
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", color.bg, color.text)}>
                  {item.signal.replace('_', ' ')}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-white/30 text-center px-4 leading-relaxed">
        ⚠️ Technical indicators are for informational purposes only. This is not financial advice. Always do your own research.
      </div>
    </div>
  );
};
