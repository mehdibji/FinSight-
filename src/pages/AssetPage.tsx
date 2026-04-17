import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ExternalLink } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../lib/utils';
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
  ColorType
} from 'lightweight-charts';

type KlineCandle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type OrderBookEntry = { price: number; quantity: number; };
type RecentTrade = { id: string; price: number; quantity: number; side: "buy" | "sell"; time: number; };
type OrderBook = { bids: OrderBookEntry[]; asks: OrderBookEntry[]; };

export const AssetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<KlineCandle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [marketInfo, setMarketInfo] = useState<{ price: number, change: number | null }>({ price: 0, change: null });
  const [intervalOption, setIntervalOption] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("15m");
  
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderAmount, setOrderAmount] = useState("");

  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const fetchHistory = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(id)}&interval=${intervalOption}&limit=240`);
      if (res.ok) {
        const json = await res.json();
        setHistory(json.candles);
        if (json.candles.length) {
           setMarketInfo(prev => ({ ...prev, price: json.candles[json.candles.length - 1].close }));
        }
      }
    } catch (err) {}
  };

  const fetchOrderBook = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/binance/depth?symbol=${encodeURIComponent(id)}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setOrderBook(json);
      }
    } catch (err) {}
  };

  const fetchTrades = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/binance/trades?symbol=${encodeURIComponent(id)}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setRecentTrades(json.trades);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchHistory();
    fetchOrderBook();
    fetchTrades();
    const timer = setInterval(() => {
      fetchOrderBook();
      fetchTrades();
    }, 5000);
    return () => clearInterval(timer);
  }, [id, intervalOption]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.6)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)' },
        horzLines: { color: 'rgba(255,255,255,0.02)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      autoSize: true,
    });

    candleSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartApi.current = chart;
    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!candleSeries.current || !history.length) return;
    const data = history.map(h => ({
      time: Math.round(h.t / 1000) as Time,
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close
    }));
    candleSeries.current.setData(data);
    chartApi.current?.timeScale().fitContent();
  }, [history]);

  const fmtUSD = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }), []);

  const orderTotal = Number(orderPrice || 0) * Number(orderAmount || 0);

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left: Chart Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/markets')} 
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{id}</h1>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] uppercase font-bold text-white/50 tracking-widest border border-white/5">Spot</span>
              </div>
              <div className="text-sm font-medium text-emerald-400">
                {marketInfo.price ? fmtUSD.format(marketInfo.price) : 'Loading...'} 
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map(interval => (
              <button
                key={interval}
                onClick={() => setIntervalOption(interval)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                  intervalOption === interval ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                {interval}
              </button>
            ))}
          </div>
        </div>

        {/* Big Chart */}
        <GlassCard className="flex-1 min-h-[500px] p-0 overflow-hidden relative border-white/5">
          <div ref={chartRef} className="absolute inset-0 m-4" />
        </GlassCard>
      </div>

      {/* Right: Order Book & Trades */}
      <div className="w-full xl:w-[400px] flex flex-col gap-4">
        
        {/* Order Ticket */}
        <GlassCard className="p-5 border-white/5 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold">Trade {id?.replace('USDT', '')}</h3>
          </div>

          <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-4 border border-white/5">
            <button 
              onClick={() => setOrderSide('buy')} 
              className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", orderSide === 'buy' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "text-white/40 hover:text-white/80")}
            >
              Buy
            </button>
            <button 
              onClick={() => setOrderSide('sell')} 
              className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", orderSide === 'sell' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "text-white/40 hover:text-white/80")}
            >
              Sell
            </button>
          </div>

          <div className="space-y-4">
             <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase tracking-widest">Price</div>
               <input 
                 value={orderPrice} 
                 onChange={e => setOrderPrice(e.target.value)} 
                 className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-16 pr-4 text-right font-medium text-white shadow-inner focus:outline-none focus:border-orange-500/50" 
                 placeholder="0.00"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase">USDT</div>
             </div>

             <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase tracking-widest">Amount</div>
               <input 
                 value={orderAmount} 
                 onChange={e => setOrderAmount(e.target.value)} 
                 className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-16 pr-4 text-right font-medium text-white shadow-inner focus:outline-none focus:border-orange-500/50" 
                 placeholder="0.00"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase">{id?.replace('USDT', '')}</div>
             </div>

             <div className="flex justify-between items-center py-2 px-1 text-sm">
               <span className="text-white/40">Total</span>
               <span className="font-bold text-white">{fmtUSD.format(orderTotal)}</span>
             </div>

             <button className={cn(
               "w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98]",
               orderSide === 'buy' ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20" : "bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20"
             )}>
               {orderSide === 'buy' ? 'Buy' : 'Sell'} {id?.replace('USDT', '')}
             </button>
          </div>
        </GlassCard>

        {/* Order Book */}
        <GlassCard className="flex-1 p-5 border-white/5 flex flex-col overflow-hidden min-h-[300px]">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-sm">Order Book</h3>
             <ExternalLink className="w-4 h-4 text-white/40" />
           </div>

           <div className="flex text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2 px-2">
             <div className="flex-1">Price (USDT)</div>
             <div className="flex-1 text-right">Amount</div>
           </div>

           <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-hide">
              {/* Asks (Sell orders - red) */}
              <div className="flex flex-col-reverse mb-2">
                {orderBook.asks.slice(0, 10).map((ask, idx) => (
                  <div key={idx} className="flex px-2 py-0.5 text-xs hover:bg-white/[0.02] cursor-pointer" onClick={() => setOrderPrice(ask.price.toString())}>
                    <div className="flex-1 text-rose-400 font-semibold">{ask.price.toFixed(2)}</div>
                    <div className="flex-1 text-right text-white/80">{ask.quantity.toFixed(4)}</div>
                  </div>
                ))}
              </div>
              
              {/* Current Price Divider */}
              <div className="py-2 px-2 border-y border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className={cn("text-lg font-bold", marketInfo.price > (history[history.length - 2]?.close || 0) ? "text-emerald-400" : "text-rose-400")}>
                  {marketInfo.price ? marketInfo.price.toFixed(2) : '--'}
                </span>
              </div>

              {/* Bids (Buy orders - green) */}
              <div className="mt-2 text-xs">
                {orderBook.bids.slice(0, 10).map((bid, idx) => (
                  <div key={idx} className="flex px-2 py-0.5 hover:bg-white/[0.02] cursor-pointer" onClick={() => setOrderPrice(bid.price.toString())}>
                     <div className="flex-1 text-emerald-400 font-semibold">{bid.price.toFixed(2)}</div>
                     <div className="flex-1 text-right text-white/80">{bid.quantity.toFixed(4)}</div>
                  </div>
                ))}
              </div>
           </div>
        </GlassCard>

      </div>
    </div>
  );
};
