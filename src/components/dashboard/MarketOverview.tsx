import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CandlestickChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { GlassCard } from "../ui/GlassCard";
import { motion, AnimatePresence } from "motion/react";

type MarketItem = {
  name: string;
  symbol: string;
  price: number;
  change: number | null;
  group: "crypto" | "stocks" | "etfs" | "commodities" | "fx";
};

type MarketOverviewResponse = {
  updatedAt: string;
  crypto: {
    BTCUSDT: { price: number; change: number } | null;
    ETHUSDT: { price: number; change: number } | null;
  };
  stocks: Array<{ name: string; symbol: string; price: number; change: number | null }>;
  etfs: Array<{ name: string; symbol: string; price: number; change: number | null }>;
  commodities: Array<{ name: string; symbol: string; price: number; change: number | null }>;
  fx: Array<{ name: string; symbol: string; price: number; change: number | null }>;
};

const TABS = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "crypto", label: "Crypto", icon: CandlestickChart },
  { id: "stocks", label: "Stocks", icon: TrendingUp },
  { id: "etfs", label: "ETF", icon: BadgeCheck },
  { id: "commodities", label: "Commodities", icon: BarChart3 },
  { id: "fx", label: "FX", icon: BookOpen },
] as const;

function Sparkline({ isUp }: { isUp: boolean }) {
  // Generate random plausible sparkline data for aesthetic purposes since we don't fetch historical for all
  const data = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ 
    v: 100 + (isUp ? i : 20 - i) + Math.random() * 5 
  })), [isUp]);
  const stroke = isUp ? "#22c55e" : "#ef4444";
  return (
    <div className="h-10 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const MarketOverview = () => {
  const [data, setData] = useState<MarketOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();

  const fmtUSD = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const items: MarketItem[] = useMemo(() => {
    if (!data) return [];
    const out: MarketItem[] = [];
    if (data.crypto?.BTCUSDT) out.push({ name: "Bitcoin", symbol: "BTCUSDT", ...data.crypto.BTCUSDT, group: "crypto" });
    if (data.crypto?.ETHUSDT) out.push({ name: "Ethereum", symbol: "ETHUSDT", ...data.crypto.ETHUSDT, group: "crypto" });
    if (data.stocks) out.push(...data.stocks.map((x) => ({ ...x, group: "stocks" as const })));
    if (data.etfs) out.push(...data.etfs.map((x) => ({ ...x, group: "etfs" as const })));
    if (data.commodities) out.push(...data.commodities.map((x) => ({ ...x, group: "commodities" as const })));
    if (data.fx) out.push(...data.fx.map((x) => ({ ...x, group: "fx" as const })));
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items
      .filter((it) => (tab === "all" ? true : it.group === tab))
      .filter((it) => (q ? it.symbol.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) : true));
  }, [debouncedQuery, items, tab]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const fetchMarket = async () => {
    try {
      setIsFetching(true);
      const res = await fetch("/api/market/overview", { cache: "no-store" });
      if (!res.ok) throw new Error("Market overview fetch failed");
      const json = (await res.json()) as MarketOverviewResponse;
      setData(json);
      setError(null);
    } catch {
      setError("Unable to refresh market feed. Displaying latest cached view.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    const id = setInterval(fetchMarket, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query);
      setVisibleCount(24);
    }, 220);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setVisibleCount(24);
  }, [tab]);

  if (!data && !error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-pulse-slow flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-orange-500 opacity-50" />
          <div className="text-white/60 text-sm font-medium">Scanning Markets…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Market Intel</h1>
          <p className="text-sm text-white/40 mt-1">
            {data ? `Last synced ${new Date(data.updatedAt).toLocaleTimeString()}` : "Live market updates"}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64 flex items-center gap-2 glass-panel rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets…"
              className="w-full bg-transparent outline-none text-sm placeholder:text-white/20 text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide py-2 gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              tab === t.id
                ? "bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg shadow-orange-500/20"
                : "glass text-white/60 hover:text-white"
            )}
          >
            <t.icon className={cn("w-4 h-4", tab === t.id ? "text-white" : "opacity-70")} />
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {visibleItems.map((it) => {
            const isUp = (it.change ?? 0) >= 0;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={it.symbol}
                onClick={() => navigate(`/asset/${encodeURIComponent(it.symbol)}`)}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <GlassCard hoverEffect className="group border border-transparent transition-all hover:border-orange-500/30 hover:shadow-[0_0_25px_rgba(249,115,22,0.25)]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center border",
                        it.group === "crypto" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                        it.group === "stocks" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                        it.group === "etfs" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                        "bg-purple-500/10 border-purple-500/20 text-purple-300"
                      )}>
                        {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold truncate max-w-[100px]">{it.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">{it.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold tabular-nums tracking-tight">{fmtUSD.format(it.price)}</div>
                      <div className={cn(
                        "text-xs font-bold tabular-nums",
                        it.change == null ? "text-white/30" : isUp ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {it.change == null ? "—" : `${isUp ? "+" : ""}${it.change.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                  <Sparkline isUp={isUp} />
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/40 text-sm">
            No assets match your criteria.
          </div>
        )}
        {filtered.length > visibleCount && (
          <div className="col-span-full flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Load More Assets
            </button>
          </div>
        )}
      </div>
      {isFetching && data && <div className="text-center text-xs text-white/40">Refreshing market feed...</div>}
    </div>
  );
};
