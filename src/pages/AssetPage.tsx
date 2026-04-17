import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ExternalLink, TrendingUp, TrendingDown, Layers, Activity, Maximize, Target } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../lib/utils';
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  ISeriesApi,
  IChartApi,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';

type KlineCandle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
type OrderBookEntry = { price: number; quantity: number; };
type OrderBook = { bids: OrderBookEntry[]; asks: OrderBookEntry[]; };

export const AssetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<KlineCandle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [marketInfo, setMarketInfo] = useState({ price: 0, change: 0, high: 0, low: 0, vol: 0 });
  const [intervalOption, setIntervalOption] = useState("15m");
  const [activeTab, setActiveTab] = useState<'chart' | 'depth' | 'info'>('chart');
  const [showIndicators, setShowIndicators] = useState(false);

  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderAmount, setOrderAmount] = useState("");

  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(id)}&interval=${intervalOption}&limit=300`);
        if (res.ok) {
          const json = await res.json();
          setHistory(json.candles);
          if (json.candles.length) {
             const c = json.candles;
             const last = c[c.length - 1];
             const first = c[0];
             const change = ((last.close - first.open) / first.open) * 100;
             setMarketInfo({ 
               price: last.close, 
               change,
               high: Math.max(...c.map((x:any)=>x.high)),
               low: Math.min(...c.map((x:any)=>x.low)),
               vol: c.reduce((a:number,b:any)=>a+b.volume,0)
             });
          }
        }
      } catch (err) {}
    };

    const fetchOrderBook = async () => {
      try {
        const res = await fetch(`/api/binance/depth?symbol=${encodeURIComponent(id)}&limit=20`);
        if (res.ok) setOrderBook(await res.json());
      } catch (err) {}
    };

    fetchHistory();
    fetchOrderBook();
    const timer = setInterval(fetchOrderBook, 3000);
    return () => clearInterval(timer);
  }, [id, intervalOption]);

  useEffect(() => {
    if (!chartRef.current || activeTab !== 'chart') return;

    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255,255,255,0.7)' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dotted }, horzLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dotted } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(100,100,255,0.2)' },
      timeScale: { borderColor: 'rgba(100,100,255,0.2)', timeVisible: true },
      autoSize: true,
    });

    candleSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', downColor: '#EF4444', borderVisible: false, wickUpColor: '#10B981', wickDownColor: '#EF4444',
    });

    volumeSeries.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartApi.current = chart;
    return () => chart.remove();
  }, [activeTab]);

  useEffect(() => {
    if (!candleSeries.current || !volumeSeries.current || !history.length || activeTab !== 'chart') return;
    const data = history.map(h => ({ time: ((h.t / 1000) + 86400) as any, open: h.open, high: h.high, low: h.low, close: h.close }));
    const vData = history.map(h => ({ time: ((h.t / 1000) + 86400) as any, value: h.volume, color: h.close > h.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }));
    candleSeries.current.setData(data);
    volumeSeries.current.setData(vData);
    chartApi.current?.timeScale().fitContent();
  }, [history, activeTab]);

  const fmtUSD = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);
  const orderTotal = Number(orderPrice || 0) * Number(orderAmount || 0);
  const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity), 0.001);
  const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity), 0.001);

  return (
    <div className="h-full flex flex-col xl:flex-row gap-4 xl:gap-6 relative">
      
      {/* LEFT/CENTER: Chart & Header */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl backdrop-blur-xl bg-black/20 border border-indigo-500/10 shadow-lg">
          <div className="flex items-center gap-4 text-white">
            <button onClick={() => navigate('/markets')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-orange-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{id}</h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] uppercase font-bold text-indigo-300">Spot</span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className={cn("text-lg font-bold transition-colors", marketInfo.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {marketInfo.price ? fmtUSD.format(marketInfo.price) : '---'} 
                </div>
                <div className="flex text-xs font-semibold gap-3 text-white/50">
                   <div><span className="text-white/30 hidden sm:inline">24h Chg:</span> <span className={marketInfo.change >= 0 ? "text-emerald-400" : "text-rose-400"}>{marketInfo.change > 0 ? '+' : ''}{marketInfo.change.toFixed(2)}%</span></div>
                   <div><span className="text-white/30 hidden sm:inline">High:</span> <span className="text-white/70">{marketInfo.high.toFixed(2)}</span></div>
                   <div><span className="text-white/30 hidden sm:inline">Low:</span> <span className="text-white/70">{marketInfo.low.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Window */}
        <div className="flex-1 min-h-[400px] flex flex-col bg-black/30 backdrop-blur-xl rounded-3xl border border-indigo-500/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           {/* Chart Toolbar */}
           <div className="flex items-center justify-between p-2 px-4 border-b border-white/5 bg-white/[0.02]">
             <div className="flex items-center gap-2">
               {['1m', '5m', '15m', '1h', '4h', '1d'].map(interval => (
                 <button
                   key={interval}
                   onClick={() => setIntervalOption(interval)}
                   className={cn(
                     "px-2.5 py-1 text-xs font-bold rounded-lg transition-all",
                     intervalOption === interval ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : "text-white/40 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   {interval}
                 </button>
               ))}
               <div className="w-[1px] h-4 bg-white/10 mx-2" />
               <button onClick={() => setShowIndicators(!showIndicators)} className={cn("p-1.5 rounded-lg transition-colors border", showIndicators ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "text-white/40 border-transparent hover:bg-white/5")}>
                 <Activity className="w-4 h-4" />
               </button>
             </div>
             <div className="flex items-center gap-2">
                {['chart', 'depth', 'info'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={cn(
                     "px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize",
                     activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   {tab}
                 </button>
               ))}
             </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 relative">
             {activeTab === 'chart' && <div ref={chartRef} className="absolute inset-0" />}
             {activeTab === 'depth' && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 font-bold">
                   <Target className="w-8 h-8 opacity-20 mb-2 mr-2" /> Depth visualization loading...
                </div>
             )}
             {activeTab === 'info' && (
                <div className="absolute inset-0 p-8 text-white/60 text-sm">
                   <h3 className="text-xl font-bold text-white mb-4">About {id}</h3>
                   <p className="max-w-xl leading-relaxed">This is a dynamic asset detailed page. Under the hood it queries order books, historical candles and executes AI sentiment analysis when prompted via the copilot sidebar.</p>
                </div>
             )}
           </div>
        </div>
      </div>

      {/* RIGHT: Order Book & Trading Panel */}
      <div className="w-full xl:w-[360px] flex flex-col gap-4">
        
        {/* Order Book */}
        <GlassCard className="flex-1 p-0 flex flex-col overflow-hidden min-h-[350px] border-indigo-500/10">
           <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
             <h3 className="font-bold text-sm tracking-wide text-white/90">Market Depth</h3>
             <Layers className="w-4 h-4 text-indigo-400" />
           </div>

           <div className="flex text-[9px] text-white/40 uppercase font-bold tracking-widest px-4 py-2 border-b border-white/5">
             <div className="w-1/3">Price</div>
             <div className="w-1/3 text-right">Amount</div>
             <div className="w-1/3 text-right">Total</div>
           </div>

           <div className="flex flex-col flex-1 overflow-hidden">
              {/* Asks */}
              <div className="flex-1 overflow-y-auto flex flex-col-reverse relative scrollbar-hide py-1">
                {orderBook.asks.slice(0, 15).map((ask, idx) => (
                  <div key={idx} className="flex px-4 py-1 text-xs hover:bg-white/[0.04] cursor-pointer relative group" onClick={() => setOrderPrice(ask.price.toString())}>
                    <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10 z-0 transition-all duration-300 ease-out" style={{ width: `${(ask.quantity / maxAskQty) * 100}%` }} />
                    <div className="w-1/3 text-rose-400 font-bold relative z-10">{ask.price.toFixed(2)}</div>
                    <div className="w-1/3 text-right text-white/80 font-medium relative z-10">{ask.quantity.toFixed(4)}</div>
                    <div className="w-1/3 text-right text-white/30 text-[10px] relative z-10">{(ask.price * ask.quantity).toFixed(0)}</div>
                  </div>
                ))}
              </div>
              
              {/* Spread / Current */}
              <div className="py-2.5 px-4 bg-indigo-500/5 border-y border-indigo-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-pulse-slow" />
                <span className={cn("text-xl font-extrabold tracking-tight relative z-10", marketInfo.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {marketInfo.price ? marketInfo.price.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-bold text-white/40 uppercase relative z-10">Spread: 0.01</span>
              </div>

              {/* Bids */}
              <div className="flex-1 overflow-y-auto relative scrollbar-hide py-1">
                {orderBook.bids.slice(0, 15).map((bid, idx) => (
                  <div key={idx} className="flex px-4 py-1 text-xs hover:bg-white/[0.04] cursor-pointer relative group" onClick={() => setOrderPrice(bid.price.toString())}>
                     <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 z-0 transition-all duration-300 ease-out" style={{ width: `${(bid.quantity / maxBidQty) * 100}%` }} />
                     <div className="w-1/3 text-emerald-400 font-bold relative z-10">{bid.price.toFixed(2)}</div>
                     <div className="w-1/3 text-right text-white/80 font-medium relative z-10">{bid.quantity.toFixed(4)}</div>
                     <div className="w-1/3 text-right text-white/30 text-[10px] relative z-10">{(bid.price * bid.quantity).toFixed(0)}</div>
                  </div>
                ))}
              </div>
           </div>
        </GlassCard>

        {/* Order Ticket */}
        <GlassCard className="p-4 shrink-0 border-indigo-500/10 bg-black/40">
          <div className="flex gap-2 p-1 bg-[#050510] rounded-xl border border-white/5 mb-4">
            <button onClick={() => setOrderSide('buy')} className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", orderSide === 'buy' ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-white/40 hover:text-white")}>
              Buy
            </button>
            <button onClick={() => setOrderSide('sell')} className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", orderSide === 'sell' ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]" : "text-white/40 hover:text-white")}>
              Sell
            </button>
          </div>

          <div className="space-y-3">
             <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-widest">Price</div>
               <input value={orderPrice} onChange={e => setOrderPrice(e.target.value)} className="w-full bg-[#050510] border border-white/5 rounded-xl py-3 pl-16 pr-12 text-right font-medium text-white shadow-inner focus:outline-none focus:border-indigo-500/50 group-hover:border-white/10 transition-colors" placeholder="0.00" />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase">USDT</div>
             </div>

             <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-widest">Amount</div>
               <input value={orderAmount} onChange={e => setOrderAmount(e.target.value)} className="w-full bg-[#050510] border border-white/5 rounded-xl py-3 pl-16 pr-12 text-right font-medium text-white shadow-inner focus:outline-none focus:border-indigo-500/50 group-hover:border-white/10 transition-colors" placeholder="0.00" />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 uppercase">{id?.replace('USDT', '')}</div>
             </div>

             <div className="pt-2 px-1">
               <div className="flex justify-between items-center text-xs mb-3">
                 <span className="text-white/40 font-bold uppercase tracking-widest">Total Value</span>
                 <span className="font-extrabold text-white text-sm">{fmtUSD.format(orderTotal)}</span>
               </div>
               <button className={cn(
                 "w-full py-3.5 rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-[0.98] uppercase tracking-wider relative overflow-hidden",
                 orderSide === 'buy' ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)]" : "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.2)]"
               )}>
                 <span className="relative z-10">{orderSide === 'buy' ? 'Execute Buy' : 'Execute Sell'}</span>
               </button>
             </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
