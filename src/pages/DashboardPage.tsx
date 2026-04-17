import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Bell, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useStore } from "../store/useStore";
import { ChatInterface } from "../components/ai/ChatInterface";
import { GlassCard } from "../components/ui/GlassCard";
import { motion } from "motion/react";

export const DashboardPage = () => {
  const { user, getTotalPortfolioValue } = useStore();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse-slow flex flex-col items-center gap-4">
          <Zap className="w-8 h-8 text-orange-500 opacity-50" />
          <div className="text-white/60 text-sm font-medium">Initializing AI Synapse…</div>
        </div>
      </div>
    );
  }

  const totalValue = getTotalPortfolioValue();

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 relative">
      
      {/* Left Column - Portfolio & Quick Stats */}
      <div className="w-full xl:w-1/4 flex flex-col gap-6 order-2 xl:order-1">
        <GlassCard hoverEffect>
          <div className="flex flex-col gap-1">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Total Net Worth</div>
            <div className="text-3xl font-extrabold text-gradient">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 w-fit px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>+2.4% Today</span>
          </div>
        </GlassCard>

        <GlassCard hoverEffect className="flex-1 min-h-[250px]">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Top Movers</div>
             <BarChart3 className="w-4 h-4 text-orange-400/50" />
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl hover:bg-white/[0.05] transition-colors cursor-pointer" onClick={() => navigate("/markets")}>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-xs">BTC</div>
                 <div className="font-semibold text-sm">Bitcoin</div>
               </div>
               <div className="text-right">
                 <div className="text-sm font-bold">$94,210</div>
                 <div className="text-xs text-emerald-400">+1.2%</div>
               </div>
             </div>

             <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl hover:bg-white/[0.05] transition-colors cursor-pointer" onClick={() => navigate("/markets")}>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">ETH</div>
                 <div className="font-semibold text-sm">Ethereum</div>
               </div>
               <div className="text-right">
                 <div className="text-sm font-bold">$4,120</div>
                 <div className="text-xs text-emerald-400">+3.4%</div>
               </div>
             </div>
          </div>
          <button onClick={() => navigate("/markets")} className="w-full mt-4 py-2 text-xs text-white/40 hover:text-white transition-colors flex justify-center items-center gap-1 font-semibold uppercase tracking-wider">
            View Market
            <ArrowRight className="w-3 h-3" />
          </button>
        </GlassCard>
      </div>

      {/* Center - AI Copilot Dashboard */}
      <div className="w-full xl:w-2/4 flex flex-col order-1 xl:order-2 lg:min-h-[600px] h-full">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-orange-500 to-rose-500 p-[1px] shadow-[0_0_40px_rgba(249,115,22,0.3)] mb-4"
          >
            <div className="w-full h-full bg-[#030305] rounded-[2rem] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-400" />
            </div>
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
            Hello, <span className="text-gradient-neon">{user.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-white/40 max-w-sm">I'm your centralized AI financial hub. Ask me about markets, perform analysis, or get setup advice.</p>
        </div>

        {/* Instead of using standard chat, we embed it seamlessly */}
        <div className="flex-1 glass-panel rounded-[2rem] overflow-hidden p-1 shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/5 relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <ChatInterface />
        </div>
      </div>

      {/* Right Column - Signals & Context */}
      <div className="w-full xl:w-1/4 flex flex-col gap-6 order-3">
        <GlassCard hoverEffect className="flex-1">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Active Signals</div>
             <Bell className="w-4 h-4 text-rose-400/50" />
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-3 items-start relative group cursor-pointer" onClick={() => navigate("/alerts")}>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.8)] transition-all" />
                <div className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl flex-1 transition-colors">
                  <div className="text-sm font-semibold mb-1">Volatility Spike Detected</div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    BTC experienced a +2.1% movement in the last 15 minutes. High volume confirms trend.
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate("/alerts")} className="w-full mt-4 py-2 text-xs text-white/40 hover:text-white transition-colors flex justify-center items-center gap-1 font-semibold uppercase tracking-wider">
            View All Signals
            <ArrowRight className="w-3 h-3" />
          </button>
        </GlassCard>
      </div>

    </div>
  );
};
