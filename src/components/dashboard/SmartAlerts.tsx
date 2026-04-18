import React, { useState } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Paywall } from '../ui/Paywall';

export const SmartAlerts: React.FC = () => {
  const { user, alerts } = useStore();
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price || !user) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'alerts'), {
        userId: user.uid,
        symbol: symbol.toUpperCase(),
        targetPrice: parseFloat(price),
        condition,
        active: true,
        createdAt: serverTimestamp(),
      });
      setSymbol('');
      setPrice('');
    } catch (error) {
      console.error('Error adding alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', id));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  return (
    <Paywall 
      requiredTier="pro" 
      title="Advanced Smart Alerts" 
      description="Upgrade to Pro to set custom price alerts and receive real-time SMS/Email notifications when markets move."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            Smart Alerts
          </h2>
          <div className="text-sm text-white/40">
            Active Signals: <span className="text-white font-bold">{alerts.filter(a => a.active).length}</span>
          </div>
        </div>

        {/* Add Alert Form */}
        <form onSubmit={handleAddAlert} className="p-6 rounded-3xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Symbol</label>
            <input 
              type="text" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTC, AAPL"
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Target Price</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="any"
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold">Condition</label>
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500/50 outline-none appearance-none"
            >
              <option value="above">Price Goes Above</option>
              <option value="below">Price Goes Below</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={isLoading || !symbol || !price}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Zap className="w-4 h-4 animate-pulse" /> : <Plus className="w-4 h-4" />}
            Set Alert
          </button>
        </form>

        {/* Alerts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  alert.condition === 'above' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {alert.condition === 'above' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold">{alert.symbol}</div>
                  <div className="text-xs text-white/40">
                    Notify when {alert.condition} <span className="text-white font-medium">${alert.targetPrice}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  alert.active ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-white/20"
                )}>
                  {alert.active ? 'Monitoring' : 'Triggered'}
                </div>
                <button 
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No alerts set. Stay ahead of market moves by setting your first alert.</p>
            </div>
          )}
        </div>
      </div>
    </Paywall>
  );
};
