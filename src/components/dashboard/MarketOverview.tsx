import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineSeries,
  Time,
} from "lightweight-charts";
import { cn } from "../../lib/utils";
import { rsi, sma } from "../../lib/indicators";

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

type KlineCandle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type OrderBookEntry = {
  price: number;
  quantity: number;
};

type RecentTrade = {
  id: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  time: number;
};

type OrderBook = {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
};

type TimePoint = { t: number; v: number };

const TABS = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "crypto", label: "Crypto", icon: CandlestickChart },
  { id: "stocks", label: "Stocks", icon: TrendingUp },
  { id: "etfs", label: "ETF", icon: BadgeCheck },
  { id: "commodities", label: "Commodities", icon: BarChart3 },
  { id: "fx", label: "FX", icon: BookOpen },
] as const;

function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Sparkline({ points, isUp }: { points: TimePoint[]; isUp: boolean }) {
  const data = points.map((p) => ({ t: p.t, v: p.v }));
  const stroke = isUp ? "#22c55e" : "#ef4444";
  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
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
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [cryptoHistory, setCryptoHistory] = useState<Record<string, KlineCandle[]>>({});
  const [interval, setIntervalValue] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("5m");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const seriesRef = useRef<Record<string, TimePoint[]>>({});

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
    if (data.crypto.BTCUSDT) out.push({ name: "Bitcoin", symbol: "BTCUSDT", ...data.crypto.BTCUSDT, group: "crypto" });
    if (data.crypto.ETHUSDT) out.push({ name: "Ethereum", symbol: "ETHUSDT", ...data.crypto.ETHUSDT, group: "crypto" });
    out.push(...data.stocks.map((x) => ({ ...x, group: "stocks" as const })));
    out.push(...data.etfs.map((x) => ({ ...x, group: "etfs" as const })));
    out.push(...data.commodities.map((x) => ({ ...x, group: "commodities" as const })));
    out.push(...data.fx.map((x) => ({ ...x, group: "fx" as const })));
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => (tab === "all" ? true : it.group === tab))
      .filter((it) => (q ? it.symbol.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) : true));
  }, [items, query, tab]);

  const selected = useMemo(
    () => filtered.find((x) => x.symbol === selectedSymbol) ?? items.find((x) => x.symbol === selectedSymbol) ?? null,
    [filtered, items, selectedSymbol],
  );

  const selectedHistory = useMemo(() => {
    if (!selected) return [];
    return cryptoHistory[selected.symbol] ?? [];
  }, [cryptoHistory, selected]);

  const orderTotal = Number(orderPrice || 0) * Number(orderAmount || 0);

  const fetchMarket = async () => {
    try {
      const res = await fetch("/api/market/overview", { cache: "no-store" });
      if (!res.ok) throw new Error("Market overview fetch failed");
      const json = (await res.json()) as MarketOverviewResponse;
      setData(json);
      setError(null);
    } catch {
      setError("Impossible de charger les données de marché.");
    }
  };

  const fetchHistory = async (symbol: string, intervalValue: typeof interval) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(intervalValue)}&limit=240`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Klines failed");
      const json = (await res.json()) as { symbol: string; interval: string; candles: KlineCandle[] };
      setCryptoHistory((prev) => ({ ...prev, [symbol]: json.candles }));
    } catch {
      // fallback silently
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchOrderBook = async (symbol: string) => {
    try {
      const res = await fetch(`/api/binance/depth?symbol=${encodeURIComponent(symbol)}&limit=20`, { cache: "no-store" });
      if (!res.ok) throw new Error("Depth failed");
      const json = (await res.json()) as { symbol: string; bids: OrderBookEntry[]; asks: OrderBookEntry[] };
      setOrderBook(json);
    } catch {
      setOrderBook({ bids: [], asks: [] });
    }
  };

  const fetchTrades = async (symbol: string) => {
    try {
      const res = await fetch(`/api/binance/trades?symbol=${encodeURIComponent(symbol)}&limit=20`, { cache: "no-store" });
      if (!res.ok) throw new Error("Trades failed");
      const json = (await res.json()) as { symbol: string; trades: RecentTrade[] };
      setRecentTrades(json.trades);
    } catch {
      setRecentTrades([]);
    }
  };

  useEffect(() => {
    fetchMarket();
    const id = setInterval(fetchMarket, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setOrderPrice(selected.price.toFixed(2));
    setOrderAmount("");
    if (selected.group === "crypto") {
      fetchHistory(selected.symbol, interval);
      fetchOrderBook(selected.symbol);
      fetchTrades(selected.symbol);
    } else {
      setOrderBook({ bids: [], asks: [] });
      setRecentTrades([]);
    }
  }, [selected?.symbol]);

  useEffect(() => {
    if (!selected || selected.group !== "crypto") return;
    fetchHistory(selected.symbol, interval);
  }, [selected?.symbol, interval]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "#050505" },
        textColor: "rgba(255,255,255,0.85)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.08)" },
        horzLines: { color: "rgba(255,255,255,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.12)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.12)",
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      localization: {
        dateFormat: "dd MMM HH:mm",
      },
    });

    candleSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    lineSeries.current = chart.addSeries(LineSeries, { color: "#f97316", lineWidth: 2 });

    const resizeObserver = new ResizeObserver(() => {
      if (!chartRef.current) return;
      chart.applyOptions({ width: chartRef.current.clientWidth });
    });
    resizeObserver.observe(chartRef.current);

    chart.applyOptions({ width: chartRef.current.clientWidth });
    chart.timeScale().fitContent();

    chartApi.current = chart;
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartApi.current || !selected) return;
    if (selected.group === "crypto" && selectedHistory.length) {
      const candleData = selectedHistory.map((item) => ({
        time: Math.round(item.t / 1000) as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      candleSeries.current?.setData(candleData);
      lineSeries.current?.setData(
        selectedHistory.map((item) => ({ time: Math.round(item.t / 1000) as Time, value: item.close })),
      );
      chartApi.current.timeScale().fitContent();
    } else {
      candleSeries.current?.setData([]);
      lineSeries.current?.setData([]);
    }
  }, [selected, selectedHistory]);

  const handlePlaceOrder = () => {
    if (!selected || orderTotal <= 0) {
      setOrderMessage("Entrez un prix et une quantité valides.");
      return;
    }
    setOrderMessage(
      `Ordre ${orderSide.toUpperCase()} simulé : ${orderAmount} ${selected.symbol} à ${fmtUSD.format(
        Number(orderPrice),
      )} (${fmtUSD.format(orderTotal)})`,
    );
  };

  const detailSeries: TimePoint[] = useMemo(() => {
    if (!selected) return [];
    if (selected.group === "crypto" && cryptoHistory[selected.symbol]?.length) return cryptoHistory[selected.symbol].map((c) => ({ t: c.t, v: c.close }));
    return seriesRef.current[selected.symbol] ?? [];
  }, [cryptoHistory, selected]);

  const indicatorData = useMemo(() => {
    const values = detailSeries.map((p) => p.v);
    const ma20 = sma(values, 20);
    const ma50 = sma(values, 50);
    const r = rsi(values, 14);
    return detailSeries.map((p, idx) => ({
      t: p.t,
      price: p.v,
      ma20: ma20[idx],
      ma50: ma50[idx],
      rsi: r[idx],
    }));
  }, [detailSeries]);

  if (!data && !error) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="text-white/60">Chargement des marchés…</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
      {/* Left: list */}
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold">Markets</div>
              <div className="text-xs text-white/40">
                {data ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}` : "—"}
              </div>
            </div>
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0F0F0F] px-4 py-2.5">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search BTCUSDT, AAPL, Gold…"
              className="w-full bg-transparent outline-none text-sm placeholder:text-white/20"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2",
                  tab === t.id
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10",
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <div className="p-2">
            {filtered.map((it) => {
              const isSelected = it.symbol === selectedSymbol;
              const isUp = (it.change ?? 0) >= 0;
              const pts = seriesRef.current[it.symbol] ?? [];
              return (
                <button
                  key={it.symbol}
                  onClick={() => setSelectedSymbol(it.symbol)}
                  className={cn(
                    "w-full text-left rounded-2xl p-3 flex items-center gap-3 border transition-colors",
                    isSelected
                      ? "bg-orange-500/10 border-orange-500/20"
                      : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center border",
                      it.group === "crypto"
                        ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                        : it.group === "stocks"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : it.group === "etfs"
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            : it.group === "commodities"
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
                              : "bg-purple-500/10 border-purple-500/20 text-purple-300",
                    )}
                  >
                    {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold truncate">{it.name}</div>
                        <div className="text-xs text-white/40">{it.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold tabular-nums">{fmtUSD.format(it.price)}</div>
                        <div
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            it.change == null ? "text-white/30" : isUp ? "text-green-400" : "text-red-400",
                          )}
                        >
                          {it.change == null ? "—" : `${isUp ? "+" : ""}${it.change.toFixed(2)}%`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[10px] text-white/30 uppercase font-bold tracking-wider">
                        {it.group}
                      </div>
                      <Sparkline points={pts.slice(-40)} isUp={isUp} />
                    </div>
                  </div>
                </button>
              );
            })}

            {!filtered.length ? (
              <div className="p-8 text-center text-white/40">Aucun résultat.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right: details */}
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Selected</div>
              <div className="text-2xl font-extrabold tracking-tight">
                {selected?.name ?? "—"}{" "}
                <span className="text-white/30 text-sm font-bold">{selected?.symbol ?? ""}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Last</div>
              <div className="text-2xl font-extrabold tabular-nums">
                {selected ? fmtUSD.format(selected.price) : "—"}
              </div>
              <div
                className={cn(
                  "text-sm font-bold tabular-nums",
                  selected?.change == null
                    ? "text-white/30"
                    : selected.change >= 0
                      ? "text-green-400"
                      : "text-red-400",
                )}
              >
                {selected?.change == null
                  ? "—"
                  : `${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}% (24h / day)`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map((i) => (
                <button
                  key={i}
                  onClick={() => setIntervalValue(i)}
                  disabled={selected?.group !== "crypto"}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    interval === i
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10",
                    selected?.group !== "crypto" && "opacity-50 cursor-not-allowed hover:bg-white/5 hover:text-white/60",
                  )}
                >
                  {i}
                </button>
              ))}
              {selected?.group !== "crypto" ? (
                <div className="text-xs text-white/30 ml-2">
                  Timeframes avancés disponibles sur crypto (historique Binance).
                </div>
              ) : null}
            </div>
            <div className="text-xs text-white/40">
              {historyLoading ? "Loading history…" : detailSeries.length ? `${detailSeries.length} pts` : "—"}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0A0A0A]/60 p-4 space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-bold">Order Book & Chart</div>
                <div className="text-xs text-white/40">Terminal view for spot market analysis.</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-white/40">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="uppercase tracking-[0.16em]">Bid / Ask</div>
                  <div className="font-bold mt-1">{orderBook.bids.length}/{orderBook.asks.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="uppercase tracking-[0.16em]">Volume</div>
                  <div className="font-bold mt-1">{recentTrades.reduce((sum, trade) => sum + trade.quantity, 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="uppercase tracking-[0.16em]">Spread</div>
                  <div className="font-bold mt-1">
                    {orderBook.bids.length && orderBook.asks.length ? fmtUSD.format(orderBook.asks[0].price - orderBook.bids[0].price) : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.85fr] gap-4">
              <div className="rounded-3xl border border-white/10 bg-[#050505] p-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-[0.2em]">{selected?.symbol ?? "—"}</div>
                    <div className="text-2xl font-bold tracking-tight">
                      {selected ? fmtUSD.format(selected.price) : "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40">24h change</div>
                    <div className={cn("font-bold tabular-nums", selected?.change && selected.change >= 0 ? "text-green-400" : "text-red-400")}> 
                      {selected?.change == null ? "—" : `${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}%`}
                    </div>
                  </div>
                </div>

                <div className="relative h-[380px] rounded-3xl overflow-hidden border border-white/10 bg-[#0B0B0B]">
                  <div ref={chartRef} className="h-full w-full" />
                  {historyLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/70">
                      Loading chart…
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-[#050505]/80 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold">Order Ticket</div>
                      <div className="text-xs text-white/40">Simulated market order entry.</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                      {orderSide}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setOrderSide("buy")}
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm font-semibold transition",
                        orderSide === "buy" ? "bg-green-500/15 text-green-300 border border-green-500/20" : "bg-white/5 text-white/70 hover:bg-white/10",
                      )}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderSide("sell")}
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm font-semibold transition",
                        orderSide === "sell" ? "bg-red-500/15 text-red-300 border border-red-500/20" : "bg-white/5 text-white/70 hover:bg-white/10",
                      )}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase text-white/40">Price</label>
                    <input
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                    />

                    <label className="block text-xs font-bold uppercase text-white/40">Quantity</label>
                    <input
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      placeholder="0.0000"
                      className="w-full rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                    />

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                      Total: <span className="font-semibold text-white">{fmtUSD.format(orderTotal)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
                    >
                      Place {orderSide === "buy" ? "Buy" : "Sell"} Order
                    </button>
                  </div>

                  {orderMessage ? <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">{orderMessage}</div> : null}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-white/10 bg-[#050505]/80 p-4">
                    <div className="text-sm font-bold mb-3">Order Book</div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto text-sm">
                      <div className="grid grid-cols-[1fr_1fr] gap-2 text-white/50 text-[11px] uppercase tracking-[0.2em]">
                        <span>Bids</span>
                        <span>Asks</span>
                      </div>
                      {Array.from({ length: Math.max(orderBook.bids.length, orderBook.asks.length) }).map((_, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr] gap-2 text-white/80 text-sm">
                          <div>{orderBook.bids[idx]?.price ? fmtUSD.format(orderBook.bids[idx].price) : "—"}</div>
                          <div>{orderBook.asks[idx]?.price ? fmtUSD.format(orderBook.asks[idx].price) : "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#050505]/80 p-4">
                    <div className="text-sm font-bold mb-3">Recent Trades</div>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto text-sm">
                      {recentTrades.length ? (
                        recentTrades.map((trade) => (
                          <div key={trade.id} className="flex items-center justify-between gap-2 text-white/80">
                            <div className="text-xs uppercase tracking-[0.18em] text-white/40">{trade.side}</div>
                            <div className={cn("font-semibold tabular-nums", trade.side === "buy" ? "text-green-400" : "text-red-400")}>
                              {fmtUSD.format(trade.price)}
                            </div>
                            <div className="text-right text-xs text-white/40">{trade.quantity.toFixed(4)}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/40">No trades available.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#0A0A0A]/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold">Technical Indicators</div>
                <div className="text-xs text-white/40">MA / RSI overview</div>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={indicatorData}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B0B0B",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "16px",
                        color: "#fff",
                      }}
                      formatter={(value: any, name: string) => {
                        if (value == null) return ["—", name];
                        if (name === "price") return [fmtUSD.format(value), "Price"];
                        return [fmtUSD.format(value), name.toUpperCase()];
                      }}
                      labelFormatter={(label) => new Date(label as number).toLocaleString()}
                    />
                    <Area type="monotone" dataKey="price" stroke="#F97316" strokeWidth={2.5} fill="url(#priceFill)" dot={false} />
                    <Line type="monotone" dataKey="ma20" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ma50" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[#0A0A0A]/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold">RSI (14)</div>
                  <div className="text-xs text-white/40">0-100</div>
                </div>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={indicatorData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} strokeDasharray="3 3" />
                      <XAxis hide dataKey="t" />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0B0B0B",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                        formatter={(value: any) => [value == null ? "—" : Number(value).toFixed(2), "RSI"]}
                        labelFormatter={(label) => new Date(label as number).toLocaleString()}
                      />
                      <Area type="monotone" dataKey="rsi" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.12} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase font-bold">Overbought</div>
                    <div className="font-bold mt-1">70+</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase font-bold">Neutral</div>
                    <div className="font-bold mt-1">30-70</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase font-bold">Oversold</div>
                    <div className="font-bold mt-1">30-</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent p-4">
                <div className="text-sm font-bold">Trend Snapshot</div>
                <div className="text-xs text-white/50 mt-1">
                  MA20 vs MA50 + RSI = une lecture rapide (pas un conseil financier).
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase font-bold">MA Bias</div>
                    <div className="font-bold mt-1">
                      {(() => {
                        const last = indicatorData[indicatorData.length - 1];
                        if (!last || last.ma20 == null || last.ma50 == null) return "—";
                        return last.ma20 >= last.ma50 ? "Bullish" : "Bearish";
                      })()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase font-bold">RSI</div>
                    <div className="font-bold mt-1">
                      {(() => {
                        const last = indicatorData[indicatorData.length - 1];
                        if (!last || last.rsi == null) return "—";
                        return last.rsi >= 70 ? "Overbought" : last.rsi <= 30 ? "Oversold" : "Neutral";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
