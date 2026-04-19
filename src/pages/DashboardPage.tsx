import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Bell, GripHorizontal, Lock, Sparkles, TrendingUp, Unlock, Wallet2, Zap, Brain } from "lucide-react";
import { useStore } from "../store/useStore";
import { ChatInterface } from "../components/ai/ChatInterface";
import { GlassCard } from "../components/ui/GlassCard";
import { motion } from "motion/react";
import { Responsive, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { cn } from "../lib/utils";

const ResponsiveGridLayout = ({ children, ...props }: any) => {
  const [width, setWidth] = useState(1200);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      <Responsive width={width} {...props}>
        {children}
      </Responsive>
    </div>
  );
};



const defaultLayouts = {
  lg: [
    { i: "portfolio", x: 0, y: 0, w: 3, h: 2 },
    { i: "movers", x: 0, y: 2, w: 3, h: 4 },
    { i: "copilot", x: 3, y: 0, w: 6, h: 6 },
    { i: "signals", x: 9, y: 0, w: 3, h: 6 }
  ]
};

type PortfolioAsset = {
  symbol: string;
  value: number;
};

export const DashboardPage = () => {
  const { user, getTotalPortfolioValue } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [layouts, setLayouts] = useState<any>(defaultLayouts);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [userPortfolio, setUserPortfolio] = useState<PortfolioAsset[]>([]);

  // Load layout
  useEffect(() => {
    const loadLayout = async () => {
      if (!user?.uid) {
        setLoadingLayout(false);
        return;
      }
      try {
        const docRef = doc(db, 'dashboards', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().layouts) {
          setLayouts(snap.data().layouts);
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          console.log(data);
          const portfolio = Array.isArray(data.portfolio) ? data.portfolio : [];
          setUserPortfolio(
            portfolio.map((asset: any) => ({
              symbol: asset?.symbol ?? "N/A",
              value: Number(asset?.value ?? 0),
            })),
          );
        }
      } catch (err) {
        console.error("Layout load error", err);
      } finally {
        setLoadingLayout(false);
      }
    };
    loadLayout();
  }, [user?.uid]);

  const onLayoutChange = async (currentLayout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'dashboards', auth.currentUser.uid);
      await setDoc(docRef, { layouts: allLayouts }, { merge: true });
    } catch (err) {}
  };

  const totalValue = getTotalPortfolioValue();
  const performance = useMemo(() => {
    const seed = (Math.sin(totalValue || 1) + 1) / 2;
    return {
      day: Number((seed * 5 - 1.2).toFixed(2)),
      week: Number((seed * 11 - 2.5).toFixed(2)),
    };
  }, [totalValue]);

  const movers = useMemo(
    () => [
      { s: "BTCUSDT", n: "Bitcoin", p: "$94,210", c: "+1.2%", iconClass: "text-orange-400 bg-orange-500/20" },
      { s: "ETHUSDT", n: "Ethereum", p: "$4,120", c: "+3.4%", iconClass: "text-blue-400 bg-blue-500/20" },
      { s: "SOLUSDT", n: "Solana", p: "$145.2", c: "+5.7%", iconClass: "text-purple-400 bg-purple-500/20" },
    ],
    [],
  );

  if (!user || loadingLayout) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        ))}
        <div className="col-span-full text-center text-sm text-white/50">Loading dashboard modules...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 z-10 backdrop-blur-md bg-black/20 p-4 rounded-3xl border border-white/5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 p-[1px] shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <div className="w-full h-full bg-[#030305] rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-400" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">{user.displayName?.split(' ')[0]}</span>
            </h1>
            <p className="text-xs text-white/40">Execution-ready cockpit with portfolio and market context.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/wallet")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <span className="flex items-center gap-2"><Wallet2 className="h-4 w-4 text-orange-400" /> Connect Wallet</span>
          </button>
          <button
            onClick={() => navigate("/markets")}
            className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_rgba(249,115,22,0.35)] transition hover:brightness-110"
          >
            Start Trading
          </button>
          <button
            type="button"
            onClick={() =>
              navigate("/copilot", {
                state: { initialPrompt: "Analyze My Portfolio" },
              })
            }
            className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
          >
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-400" />
              Analyze My Portfolio
            </span>
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              isEditing 
                ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {isEditing ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="hidden sm:inline">{isEditing ? "Save Layout" : "Customize"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Today P&L</div>
          <div className={cn("mt-2 text-xl font-bold", performance.day >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {performance.day >= 0 ? "+" : ""}{performance.day}%
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">7D Performance</div>
          <div className={cn("mt-2 text-xl font-bold", performance.week >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {performance.week >= 0 ? "+" : ""}{performance.week}%
          </div>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Portfolio Value</div>
          <div className="mt-2 text-xl font-bold text-white">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="-mx-2 flex min-h-[560px] flex-1 flex-col">
        <ResponsiveGridLayout
          className={cn("layout", isEditing && "bg-white/[0.01] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIi8+PGRpcGxhY2VtZW50IG1hcD1pZCAvPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] rounded-3xl border border-white/5")}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".drag-handle"
          margin={[16, 16]}
        >
          {/* Portfolio Widget */}
          <div key="portfolio" className="flex">
            <GlassCard className="flex-1 w-full h-full p-6 flex flex-col justify-center relative overflow-hidden group border border-indigo-500/10 hover:border-orange-500/30 transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              {isEditing && (
                <div className="drag-handle absolute top-2 right-2 p-1.5 cursor-move bg-white/10 hover:bg-white/20 rounded-md z-20">
                  <GripHorizontal className="w-4 h-4 text-white/50" />
                </div>
              )}
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold z-10">Total Net Worth</div>
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 z-10 mt-1">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 w-fit px-2.5 py-1 rounded-full z-10">
                <TrendingUp className="w-3 h-3" />
                <span>+2.4% Today</span>
              </div>
              <div className="mt-4 z-10 space-y-1.5 text-xs text-white/80">
                {userPortfolio.map((asset, index) => (
                  <div key={`${asset.symbol}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
                    <p>{asset.symbol}</p>
                    <p>{asset.value}€</p>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                 <Zap className="w-48 h-48" />
              </div>
            </GlassCard>
          </div>

          {/* Top Movers Widget */}
          <div key="movers" className="flex">
            <GlassCard className="flex-1 w-full h-full p-5 flex flex-col relative border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
              {isEditing && (
                <div className="drag-handle absolute top-2 right-2 p-1.5 cursor-move bg-white/10 hover:bg-white/20 rounded-md z-20">
                  <GripHorizontal className="w-4 h-4 text-white/50" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                 <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Top Movers</div>
                 <BarChart3 className="w-4 h-4 text-orange-400/50" />
              </div>
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto scrollbar-hide">
                 {movers.map((m) => (
                   <div key={m.s} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer" onClick={() => navigate(`/asset/${encodeURIComponent(m.s)}`)}>
                     <div className="flex items-center gap-3">
                       <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px]", m.iconClass)}>
                         {m.s.replace("USDT", "")}
                       </div>
                       <div className="font-semibold text-sm">{m.n}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-bold">{m.p}</div>
                       <div className="text-xs text-emerald-400 font-medium">{m.c}</div>
                     </div>
                   </div>
                 ))}
              </div>
            </GlassCard>
          </div>

          {/* AI Copilot Widget */}
          <div key="copilot" className="flex">
            <div className="flex-1 w-full h-full relative group">
              {isEditing && (
                <div className="drag-handle absolute -top-3 -right-3 p-2 cursor-move bg-indigo-500 text-white rounded-full z-50 shadow-lg hover:scale-110 transition-transform">
                  <GripHorizontal className="w-4 h-4" />
                </div>
              )}
              <div className={cn("w-full h-full pointer-events-auto", isEditing && "pointer-events-none opacity-50")}>
                <ChatInterface />
              </div>
            </div>
          </div>

          {/* Active Signals Widget */}
          <div key="signals" className="flex">
            <GlassCard className="flex-1 w-full h-full p-5 flex flex-col relative border border-indigo-500/10 hover:border-rose-500/30 transition-colors">
              {isEditing && (
                <div className="drag-handle absolute top-2 right-2 p-1.5 cursor-move bg-white/10 hover:bg-white/20 rounded-md z-20">
                  <GripHorizontal className="w-4 h-4 text-white/50" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4 mt-2">
                 <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold text-rose-400">Active Signals</div>
                 <Bell className="w-4 h-4 text-rose-400/80" />
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {[1, 2].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start relative group cursor-pointer" onClick={() => navigate("/alerts")}>
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2.5 flex-shrink-0 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.8)] transition-all" />
                    <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/5 p-3 rounded-2xl flex-1 group-hover:border-rose-500/30 transition-colors">
                      <div className="text-sm font-bold text-white/90 mb-1">Volatility Spike</div>
                      <div className="text-xs text-white/50 leading-relaxed font-medium">
                        BTC +2.1% (15m). High volume confirms trend.
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate("/alerts")} className="w-full mt-4 py-2 text-[10px] text-white/40 hover:text-white transition-colors flex justify-center items-center gap-1 font-bold uppercase tracking-wider bg-white/5 rounded-xl hover:bg-white/10">
                View All
                <ArrowRight className="w-3 h-3" />
              </button>
            </GlassCard>
          </div>

        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
