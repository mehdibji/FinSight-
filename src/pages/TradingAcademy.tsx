import React, { useState, useMemo } from 'react';
import { GraduationCap, Play, CheckCircle2, Lock, Clock, BarChart3, Brain, Shield, TrendingUp, Zap, BookOpen, Target, Activity, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { GlassCard } from '../components/ui/GlassCard';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: Difficulty;
  category: string;
  icon: React.ElementType;
  color: string;
};

const LESSONS: Lesson[] = [
  // Foundations
  { id: 'candles', title: 'Candlestick Patterns', description: 'Master doji, hammer, engulfing, and 15+ candlestick patterns that predict reversals.', duration: '25 min', difficulty: 'beginner', category: 'Foundations', icon: BarChart3, color: '#F97316' },
  { id: 'support', title: 'Support & Resistance', description: 'Identify key price levels, draw trend lines, and spot breakout zones.', duration: '20 min', difficulty: 'beginner', category: 'Foundations', icon: TrendingUp, color: '#F97316' },
  { id: 'trends', title: 'Trend Identification', description: 'Higher highs, lower lows — learn to read market structure like a pro.', duration: '15 min', difficulty: 'beginner', category: 'Foundations', icon: Activity, color: '#F97316' },
  // Indicators Mastery
  { id: 'rsi_deep', title: 'RSI Deep Dive', description: 'Beyond overbought/oversold — divergence, failure swings, and hidden setups.', duration: '30 min', difficulty: 'intermediate', category: 'Indicators', icon: Target, color: '#6366F1' },
  { id: 'macd_pro', title: 'MACD Pro Techniques', description: 'Signal line crossovers, histogram analysis, and multi-timeframe MACD.', duration: '35 min', difficulty: 'intermediate', category: 'Indicators', icon: Activity, color: '#6366F1' },
  { id: 'bollinger', title: 'Bollinger Band Strategies', description: 'Squeeze plays, walking the bands, and mean reversion with Bollinger.', duration: '25 min', difficulty: 'intermediate', category: 'Indicators', icon: BarChart3, color: '#6366F1' },
  // Day Trading Strategies
  { id: 'scalping', title: 'Scalping Strategy', description: 'Quick 1-5 minute trades using order flow, tape reading, and momentum.', duration: '40 min', difficulty: 'advanced', category: 'Strategies', icon: Zap, color: '#10B981' },
  { id: 'momentum', title: 'Momentum Trading', description: 'Ride strong moves with volume confirmation and trailing stops.', duration: '35 min', difficulty: 'advanced', category: 'Strategies', icon: TrendingUp, color: '#10B981' },
  { id: 'breakout', title: 'Breakout Trading', description: 'Trade consolidation breakouts with volume spikes and retest entries.', duration: '30 min', difficulty: 'advanced', category: 'Strategies', icon: Target, color: '#10B981' },
  { id: 'mean_rev', title: 'Mean Reversion', description: 'Fade extreme moves using Bollinger, RSI, and VWAP mean reversion.', duration: '30 min', difficulty: 'advanced', category: 'Strategies', icon: Activity, color: '#10B981' },
  // Risk Management
  { id: 'position', title: 'Position Sizing', description: 'Calculate optimal position sizes using Kelly Criterion and risk %.', duration: '20 min', difficulty: 'intermediate', category: 'Risk', icon: Shield, color: '#EF4444' },
  { id: 'stops', title: 'Stop-Loss Strategies', description: 'ATR-based stops, trailing stops, and time-based exits.', duration: '25 min', difficulty: 'intermediate', category: 'Risk', icon: Shield, color: '#EF4444' },
  { id: 'rr_ratio', title: 'Risk/Reward Ratios', description: 'Target 2:1+ R:R setups and manage your expectancy edge.', duration: '20 min', difficulty: 'beginner', category: 'Risk', icon: Target, color: '#EF4444' },
  // Psychology
  { id: 'discipline', title: 'Trading Discipline', description: 'Build a rules-based trading system and stick to your plan every day.', duration: '15 min', difficulty: 'beginner', category: 'Psychology', icon: Brain, color: '#A855F7' },
  { id: 'journal', title: 'Trade Journaling', description: 'Review, reflect, and improve using systematic trade journaling.', duration: '20 min', difficulty: 'beginner', category: 'Psychology', icon: BookOpen, color: '#A855F7' },
];

const CATEGORIES = ['All', 'Foundations', 'Indicators', 'Strategies', 'Risk', 'Psychology'];
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  advanced: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export const TradingAcademy = () => {
  const [category, setCategory] = useState('All');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('finsight_academy_progress');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const { isPro } = useSubscription();
  const navigate = useNavigate();

  const filtered = useMemo(() =>
    category === 'All' ? LESSONS : LESSONS.filter(l => l.category === category),
    [category]
  );

  const progress = Math.round((completedLessons.size / LESSONS.length) * 100);

  const toggleCompletion = (id: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('finsight_academy_progress', JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            {isPro ? 'Pro Access — Free Formation' : 'Preview Mode'}
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Day Trading Academy</h1>
          <p className="text-sm text-white/40 mt-1 max-w-lg">
            Master professional day trading strategies. {isPro ? 'All modules unlocked with your Pro subscription.' : 'Upgrade to Pro to unlock all modules — free with your first subscription.'}
          </p>
        </div>

        {/* Progress */}
        <GlassCard className="p-4 min-w-[200px] border-white/5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Your Progress</div>
          <div className="text-2xl font-black text-white">{progress}%</div>
          <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-500"
            />
          </div>
          <div className="text-xs text-white/50 mt-1">{completedLessons.size}/{LESSONS.length} modules</div>
        </GlassCard>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
              category === cat
                ? "bg-gradient-to-r from-orange-600 to-purple-500 text-white shadow-lg shadow-orange-500/20"
                : "glass text-white/60 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lesson Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((lesson, i) => {
          const isCompleted = completedLessons.has(lesson.id);
          const isLocked = !isPro && i > 2; // First 3 are free preview
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className={cn(
                "p-0 overflow-hidden border-white/5 group relative h-full",
                isLocked && "opacity-60"
              )}>
                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
                    <Lock className="w-8 h-8 text-white/30 mb-3" />
                    <p className="text-xs text-white/40 font-bold">Pro Required</p>
                    <button onClick={() => navigate('/pricing')} className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 text-white text-xs font-bold hover:scale-105 transition-transform">
                      Upgrade
                    </button>
                  </div>
                )}

                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${lesson.color}15`, border: `1px solid ${lesson.color}30` }}>
                      <lesson.icon className="w-5 h-5" style={{ color: lesson.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border", DIFFICULTY_COLORS[lesson.difficulty])}>
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-bold text-white mb-1">{lesson.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed mb-4">{lesson.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <Clock className="w-3 h-3" />
                      {lesson.duration}
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => toggleCompletion(lesson.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {isCompleted ? <><CheckCircle2 className="w-3.5 h-3.5" /> Done</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Banner for non-Pro */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-indigo-500/10 p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <div className="relative z-10">
            <GraduationCap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-2xl font-extrabold mb-2">Get Full Academy Access Free</h3>
            <p className="text-white/50 max-w-md mx-auto mb-6">
              Subscribe to Pro and unlock the complete Day Trading Academy — 15 professional modules — included free with your first subscription.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
            >
              Upgrade to Pro <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
