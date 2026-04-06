import React, { useState } from 'react';
import { Wallet, Plus, Trash2, DollarSign, PieChart, Zap, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore, Asset } from '../../store/useStore';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export const WalletTracker: React.FC = () => {
  const { user, assets } = useStore();
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'crypto' | 'stock' | 'forex'>('crypto');
  const [isLoading, setIsLoading] = useState(false);
  const { isPro } = useSubscription();
  const navigate = useNavigate();

  const FREE_TIER_LIMIT = 3;
  const hitLimit = !isPro && assets.length >= FREE_TIER_LIMIT;

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amount || !user || hitLimit) return;

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
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assets', id));
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-orange-500" />
          Wallet Tracker
        </h2>
        <div className="text-sm text-white/40">
          Total Assets: <span className="text-white font-bold">{assets.length}</span>
          {!isPro && <span className="ml-1">/ {FREE_TIER_LIMIT}</span>}
        </div>
      </div>

      {/* Add Asset Form */}
      <div className="relative">
        {hitLimit && (
          <div className="absolute inset-0 z-10 bg-[#0A0A0A]/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
              <Lock className="w-4 h-4" />
              Asset Limit Reached
            </div>
            <p className="text-xs text-white/60 mb-4">Upgrade to Pro to track unlimited assets.</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        )}
        <form onSubmit={handleAddAsset} className={cn("p-6 rounded-3xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end", hitLimit && "opacity-50 pointer-events-none")}>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Symbol</label>
            <input 
              type="text" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTC, AAPL, EUR"
              disabled={hitLimit}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Amount</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              disabled={hitLimit}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={hitLimit}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none appearance-none disabled:opacity-50"
            >
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
              <option value="forex">Forex</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={isLoading || !symbol || !amount || hitLimit}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Zap className="w-4 h-4 animate-pulse" /> : <Plus className="w-4 h-4" />}
            Add Asset
          </button>
        </form>
      </div>

      {/* Assets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                asset.type === 'crypto' ? "bg-blue-500/10 text-blue-500" :
                asset.type === 'stock' ? "bg-green-500/10 text-green-500" :
                "bg-purple-500/10 text-purple-500"
              )}>
                {asset.type === 'crypto' ? <Zap className="w-5 h-5" /> :
                 asset.type === 'stock' ? <PieChart className="w-5 h-5" /> :
                 <DollarSign className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold">{asset.symbol}</div>
                <div className="text-xs text-white/40 capitalize">{asset.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="font-bold">{asset.amount.toLocaleString()}</div>
                <div className="text-[10px] text-green-500 font-bold">Active</div>
              </div>
              <button 
                onClick={() => handleDeleteAsset(asset.id)}
                className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <PieChart className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No assets tracked yet. Add your first asset above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
