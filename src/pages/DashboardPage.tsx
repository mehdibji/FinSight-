import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Bell, Sparkles, Wallet } from "lucide-react";
import { PortfolioChart } from "../components/dashboard/PortfolioChart";
import { MarketOverview } from "../components/dashboard/MarketOverview";
import { useStore } from "../store/useStore";

export const DashboardPage = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  // 🔒 sécurité anti crash
  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="text-white/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider font-bold">
            Welcome back
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {user.displayName}
          </h1>
          <div className="text-sm text-white/40 mt-1">{user.email}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/wallet")}
            className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold flex items-center gap-2"
          >
            <Wallet className="w-4 h-4 text-orange-400" />
            Portfolio
            <ArrowRight className="w-4 h-4 text-white/40" />
          </button>
          <button
            onClick={() => navigate("/markets")}
            className="px-4 py-2.5 rounded-2xl bg-orange-500/15 hover:bg-orange-500/20 border border-orange-500/25 text-sm font-bold text-orange-300 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Markets
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
          <button
            onClick={() => navigate("/alerts")}
            className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold flex items-center gap-2"
          >
            <Bell className="w-4 h-4 text-orange-400" />
            Signals
            <ArrowRight className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-bold">
                Portfolio performance
              </div>
              <div className="text-lg font-extrabold">Overview</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Smart insights soon
            </div>
          </div>
          <PortfolioChart />
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider font-bold">
            Quick wins
          </div>
          <div className="text-lg font-extrabold mt-1">Next best actions</div>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => navigate("/markets")}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold">Check trend setup</div>
                <ArrowRight className="w-4 h-4 text-white/40" />
              </div>
              <div className="text-xs text-white/40 mt-1">
                Use MA20/MA50 + RSI to spot momentum shifts.
              </div>
            </button>
            <button
              onClick={() => navigate("/wallet")}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold">Add an asset</div>
                <ArrowRight className="w-4 h-4 text-white/40" />
              </div>
              <div className="text-xs text-white/40 mt-1">
                Track crypto, stocks or FX positions.
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-bold">
              Market terminal
            </div>
            <div className="text-lg font-extrabold">Live watchlist</div>
          </div>
          <button
            onClick={() => navigate("/markets")}
            className="text-sm font-bold text-orange-300 hover:text-orange-200 flex items-center gap-2"
          >
            Open full markets
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <MarketOverview />
      </div>
    </div>
  );
};
