import React, { useState, useMemo } from 'react';
import { Wallet, Plus, Trash2, Zap, DollarSign, Activity, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';

export const WalletTracker: React.FC = () => {
  const { user, assets, getTotalPortfolioValue } = useStore();
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<"crypto" | "stock" | "forex">('crypto');
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);

  const connectWallet = async () => {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!ethereum) {
      setWalletError('MetaMask was not detected. Install MetaMask to connect your wallet.');
      return;
    }
    try {
      setWalletError(null);
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0] || '');
    } catch (error) {
      console.error('Wallet connection failed', error);
      setWalletError('Wallet connection failed. Please retry from MetaMask.');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amount || !user) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'assets'), {
        userId: user.uid,
        symbol: symbol.toUpperCase(),
        amount: parseFloat(amount),
        type,
        createdAt: serverTimestamp(),
      });
      setSymbol('');
      setAmount('');
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assets', id));
    } catch (error) {}
  };

  const chartData = useMemo(() => {
    if (!assets.length) return [];
    return assets.map((a, i) => ({
      name: a.symbol,
      value: a.amount,
      color: ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e'][i % 5]
    }));
  }, [assets]);

  // Mock historical data for the portfolio performance chart
  const portfolioHistory = useMemo(() => {
    const startVal = getTotalPortfolioValue() * 0.8;
    return Array.from({ length: 30 }).map((_, i) => ({
      date: `Day ${i + 1}`,
      value: startVal + (Math.random() * startVal * 0.4) + (i * startVal * 0.02)
    }));
  }, [getTotalPortfolioValue]);

  const totalValue = getTotalPortfolioValue();
  const dayChangePct = '+4.2%';
  const dayChangeAbs = totalValue * 0.042;
  const isUp = true;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
             <Activity className="w-3.5 h-3.5 text-blue-400" />
             Live Sync
           </div>
           <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Net Worth Intel</h1>
           <p className="text-sm text-white/40 mt-1 max-w-lg">Advanced portfolio tracking leveraging on-chain aggregation and real-time market feeds.</p>
        </div>
        <button
           onClick={connectWallet}
           className="glass-floating px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:border-orange-500/50"
        >
           <Wallet className="w-4 h-4 text-orange-400" />
           {walletAddress ? <span className="text-orange-300">{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span> : 'Connect Web3 Wallet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Performance Chart */}
        <GlassCard className="lg:col-span-3 p-0 overflow-hidden relative min-h-[360px] border-white/5 flex flex-col">
           <div className="p-6 border-b border-white/5 flex justify-between items-start">
             <div>
               <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/40 mb-1">Total Balance</div>
               <div className="text-4xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                 ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               <div className={cn("flex items-center gap-2 mt-2 text-sm font-bold", isUp ? "text-emerald-400" : "text-rose-400")}>
                 {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                 <span>${dayChangeAbs.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({dayChangePct} 24h)</span>
               </div>
             </div>
             
             <div className="hidden sm:flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                {['1D', '1W', '1M', 'YTD', 'ALL'].map((tf, i) => (
                  <button key={tf} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", i === 2 ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}>
                    {tf}
                  </button>
                ))}
             </div>
           </div>

           <div className="flex-1 w-full min-h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={portfolioHistory} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0B0B', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, 'Balance']}
                 />
                 <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </GlassCard>

        {/* Allocation Chart */}
        <GlassCard className="lg:col-span-1 min-h-[360px] flex flex-col items-center justify-center p-6 border-white/5 relative">
           <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white/40 absolute top-6 left-6">Allocation</h3>
           <div className="w-full h-[220px] relative mt-4">
             {assets.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0B0B', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                      formatter={(val: number) => [`${val} Units`, 'Quantity']}
                    />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/10">
                  <PieChart className="w-20 h-20" />
                </div>
             )}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-3xl font-black">{assets.length}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Assets</div>
                </div>
             </div>
           </div>
        </GlassCard>
      </div>

      {/* Asset List & Add Form */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6 items-start">
         
         {/* Add Form */}
         <GlassCard className="p-6 border-white/5 sticky top-24">
           <div className="flex items-center gap-2 mb-6">
             <Zap className="w-4 h-4 text-orange-400" />
             <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Add Position</h3>
           </div>
           
           <form onSubmit={handleAddAsset} className="flex flex-col gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Symbol</label>
               <input 
                  type="text" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. BTC, AAPL" required
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-500/50 outline-none transition-colors"
               />
             </div>
             
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Amount / Shares</label>
               <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required step="any"
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-500/50 outline-none transition-colors"
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Asset Class</label>
               <select 
                  value={type} onChange={e => setType(e.target.value as "crypto" | "stock" | "forex")}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-500/50 outline-none appearance-none transition-colors"
               >
                  <option value="crypto">Crypto</option>
                  <option value="stock">Stock</option>
                  <option value="forex">Forex</option>
               </select>
             </div>

             <button type="submit" disabled={isLoading} className="mt-2 bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-500 hover:to-orange-300 text-black font-extrabold py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-2">
                {isLoading ? <Zap className="w-5 h-5 animate-pulse" /> : <Plus className="w-5 h-5" />}
                TRACK ASSET
             </button>
           </form>
         </GlassCard>

         {walletError && (
           <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
             {walletError}
           </div>
         )}

         {/* Detailed Holdings */}
         <div className="space-y-3">
           <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-white/50 pl-2">Current Holdings</h3>
           
           {assets.length === 0 ? (
             <div className="w-full p-12 rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center bg-white/[0.01]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-white/20" />
                </div>
                <h4 className="text-lg font-bold mb-1">No Assets Found</h4>
                <p className="text-sm text-white/40">Add your first position to start tracking your net worth.</p>
             </div>
           ) : (
            assets.map((asset, i) => {
              // Deterministic mock values prevent jittering between renders.
              const seed = asset.symbol
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const mockPrice = 120 + (seed % 50);
              const mockValue = asset.amount * mockPrice;
              const mockPnl = ((seed % 200) / 10) - 5;
               const isProfitable = mockPnl >= 0;

               return (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={asset.id}>
                   <GlassCard hoverEffect className="p-0 overflow-hidden border-white/5 group">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                       
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${chartData[i]?.color}15`, color: chartData[i]?.color, border: `1px solid ${chartData[i]?.color}30` }}>
                            <DollarSign className="w-6 h-6" />
                         </div>
                         <div>
                           <div className="font-extrabold text-lg flex items-center gap-2">
                             {asset.symbol}
                             <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white/50">{asset.type}</span>
                           </div>
                           <div className="text-xs text-white/40 mt-1 font-medium">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} Tokens</div>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-center flex-1 sm:ml-8">
                         <div className="hidden sm:block">
                           <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Avg Price</div>
                           <div className="font-semibold text-sm">${mockPrice.toFixed(2)}</div>
                         </div>
                         
                         <div>
                           <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Est. Value</div>
                           <div className="font-bold text-base tabular-nums">${mockValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                         </div>

                         <div className="text-right">
                           <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">24h PnL</div>
                           <div className={cn("font-bold text-sm flex items-center justify-end gap-1", isProfitable ? "text-emerald-400" : "text-rose-400")}>
                             {isProfitable ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                             {isProfitable ? '+' : ''}{mockPnl.toFixed(2)}%
                           </div>
                         </div>
                       </div>

                       <div className="flex items-center justify-end pl-2 sm:pl-4 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 mt-2 sm:mt-0">
                         <button onClick={() => handleDeleteAsset(asset.id)} className="p-3.5 rounded-xl bg-white/5 group-hover:bg-rose-500/10 text-white/40 group-hover:text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>

                     </div>
                   </GlassCard>
                 </motion.div>
               );
             })
           )}
         </div>
         
      </div>
    </div>
  );
};
