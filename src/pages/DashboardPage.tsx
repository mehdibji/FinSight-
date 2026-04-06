import React, { useState, useEffect } from 'react';
import { MarketOverview } from '../components/dashboard/MarketOverview';
import { PortfolioChart } from '../components/dashboard/PortfolioChart';
import { ChatInterface } from '../components/ai/ChatInterface';
import { useStore } from '../store/useStore';
import { Wallet, ArrowRight, TrendingUp, TrendingDown, Activity, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const DashboardPage = () => {
  const { getTotalPortfolioValue } = useStore();
  const totalValue = getTotalPortfolioValue();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('1M');
  const [searchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('session_id')) {
      setShowSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left Column */}
      <div className="xl:col-span-8 space-y-6">
        
        {showSuccess && (
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Subscription successful! Your account has been upgraded to Pro.</p>
          </div>
        )}

        {totalValue === 0 ? (
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Welcome to FinSight AI</h2>
            <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
              Your portfolio is currently empty. Add your first asset to unlock AI-driven insights, real-time tracking, and market signals.
            </p>
            <button 
              onClick={() => navigate('/wallet')}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center gap-2"
            >
              Add Your First Asset <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8 rounded-3xl bg-[#0A0A0A] border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Total Portfolio Value</h3>
                <div className="flex items-end gap-3">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-green-500 font-medium mb-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +4.2%
                  </div>
                </div>
              </div>
              
              {/* Time Filters */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg self-start">
                {['1D', '1W', '1M', '1Y', 'ALL'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeFilter === filter ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Mock Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs text-white/40 mb-1">vs Benchmark (S&P 500)</div>
                <div className="text-sm font-semibold text-green-500">+1.8%</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs text-white/40 mb-1">Max Drawdown</div>
                <div className="text-sm font-semibold text-red-500">-12.4%</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs text-white/40 mb-1">Volatility (30d)</div>
                <div className="text-sm font-semibold text-white/80">Medium (14%)</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs text-white/40 mb-1">Top Mover</div>
                <div className="text-sm font-semibold text-green-500">BTC (+8.2%)</div>
              </div>
            </div>

            <PortfolioChart />
          </div>
        )}

        <MarketOverview />
      </div>

      {/* Right Column - AI Copilot Widget */}
      <div className="xl:col-span-4 h-[600px] xl:h-[calc(100vh-10rem)] min-h-[500px]">
        <ChatInterface />
      </div>
    </div>
  );
};
