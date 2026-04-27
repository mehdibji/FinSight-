import React, { useEffect, useState, useMemo } from "react";
import { Zap, ArrowRight, Activity, Globe, Lock, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { GlassCard } from "../components/ui/GlassCard";

interface LandingPageProps {
  onLogin?: () => Promise<void>;
}

// Live Market Ticker
const TickerItem = ({ symbol, price, change }: { symbol: string; price: string; change: number }) => (
  <div className="flex items-center gap-3 px-4 py-1.5">
    <span className="text-xs font-bold text-white/80">{symbol}</span>
    <span className="text-xs font-medium text-white/60">{price}</span>
    <span className={`text-xs font-bold ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
      {change >= 0 ? "+" : ""}{change.toFixed(2)}%
    </span>
  </div>
);

const MarketTicker = () => {
  const [marketData, setMarketData] = useState<{ btcPrice: string; btcChange: number; ethPrice: string; ethChange: number } | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true");
        if (!res.ok) return;
        const data = await res.json();
        setMarketData({
          btcPrice: `$${data.bitcoin.usd.toLocaleString()}`,
          btcChange: data.bitcoin.usd_24h_change,
          ethPrice: `$${data.ethereum.usd.toLocaleString()}`,
          ethChange: data.ethereum.usd_24h_change,
        });
      } catch {}
    };
    fetchPrices();
  }, []);

  const items = useMemo(() => {
    if (!marketData) return [
      { symbol: "BTC", price: "$94,210", change: 1.2 },
      { symbol: "ETH", price: "$4,120", change: 3.4 },
      { symbol: "SOL", price: "$145.2", change: 5.7 },
      { symbol: "S&P 500", price: "5,241", change: 0.82 },
      { symbol: "NASDAQ", price: "18,339", change: 1.15 },
      { symbol: "GOLD", price: "$2,178", change: 0.12 },
    ];
    return [
      { symbol: "BTC", price: marketData.btcPrice, change: marketData.btcChange },
      { symbol: "ETH", price: marketData.ethPrice, change: marketData.ethChange },
      { symbol: "SOL", price: "$145.2", change: 5.7 },
      { symbol: "S&P 500", price: "5,241", change: 0.82 },
      { symbol: "NASDAQ", price: "18,339", change: 1.15 },
      { symbol: "GOLD", price: "$2,178", change: 0.12 },
    ];
  }, [marketData]);

  // Duplicate for seamless scroll
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-md">
      <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
        {doubled.map((item, i) => (
          <TickerItem key={`${item.symbol}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
};

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (onLogin) {
        await onLogin();
        navigate("/dashboard");
        return;
      }
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur login :", error);
      alert("Erreur lors de la connexion");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-orange-500/30">
      {/* CSS for marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 cyber-grid opacity-30" />
      </div>

      {/* Background Ambience - Reduced blur for performance */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-tr from-orange-600/10 to-rose-500/10 blur-[80px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full bg-gradient-to-br from-blue-600/10 to-purple-500/10 blur-[60px] translate-x-1/4 -translate-y-1/4"
        />
        {/* Futuristic dot grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      {/* Live Market Ticker */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <MarketTicker />
      </div>

      {/* Top Nav */}
      <header className="absolute top-12 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">FinSight</span>
          <span className="text-[9px] uppercase tracking-widest font-bold text-orange-400/70 ml-1">AI</span>
        </div>
        <button onClick={handleLogin} className="glass-floating px-5 py-2.5 rounded-2xl text-sm font-bold hover:text-orange-400 transition-colors relative overflow-hidden group">
          <span className="relative z-10">Sign In</span>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      </header>

      {/* Main Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full mt-28"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold mb-8 uppercase tracking-widest backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Next-Gen Interface v3.0
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6">
          Institutional edge. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500">
            Retail simplicity.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 font-medium leading-relaxed">
          The ultimate AI-powered terminal. Analyze real-time markets, track your global portfolio, and execute strategies with an intelligent Copilot.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center mb-20 w-full sm:w-auto">
          <button
            onClick={handleLogin}
            className="w-full sm:w-auto relative group overflow-hidden bg-white text-black px-8 py-4 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Launch FinSight AI <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 mix-blend-multiply" />
          </button>
        </motion.div>

        {/* Bento Grid Features */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <motion.div variants={itemVariants}>
            <GlassCard className="h-full text-left p-6 border-white/5 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-shadow duration-500">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-orange-400 glow-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">Global Markets</h3>
              <p className="text-sm text-white/50 leading-relaxed">Live data across Crypto, Stocks, ETFs and FX. Integrated order books and lightweight-charts.</p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="h-full text-left p-6 border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent relative overflow-hidden hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-shadow duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 relative z-10">
                <Zap className="w-5 h-5 text-blue-400 glow-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2 relative z-10">AI Copilot</h3>
              <p className="text-sm text-white/50 leading-relaxed relative z-10">Your personal quant. Ask Gemini 3.1 Pro to analyze charts, explain concepts, and find signal alpha.</p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="h-full text-left p-6 border-white/5 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-shadow duration-500">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-emerald-400 glow-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">Secure Sync</h3>
              <p className="text-sm text-white/50 leading-relaxed">Connect unlimited Web3 wallets seamlessly. Your portfolio is aggregated securely with zero-knowledge.</p>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div variants={itemVariants} className="mt-16 flex items-center gap-6 text-[11px] text-white/30 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> End-to-end encrypted</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> 99.9% uptime</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Global coverage</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
