import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Globe, 
  BarChart3, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Newspaper
} from 'lucide-react';
import { useMarketData } from '../../hooks/useMarketData';

export const MarketOverview: React.FC = () => {
  const { data: markets, isLoading, error } = useMarketData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-orange-500" />
          Global Markets
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <Clock className="w-3 h-3" />
          {isLoading ? 'Updating...' : 'Live Updates'}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <div 
            key={market.name}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-white/60">{market.name}</span>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                market.positive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {market.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {market.change}
              </div>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">
              {market.value}
            </div>
            <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  market.positive ? "bg-green-500" : "bg-red-500"
                )} 
                style={{ width: market.positive ? '65%' : '40%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market Sentiment */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-white">Market Sentiment Analysis</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            The Fear & Greed Index is currently at <span className="text-orange-500 font-bold">68 (Greed)</span>. 
            Market momentum remains strong in tech sectors, while crypto assets see minor consolidation after recent highs.
            <br/><br/>
            <span className="text-xs text-white/40 italic">AI Signal: Bullish on AI infrastructure, neutral on broad market indices.</span>
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Top Gainer</div>
              <div className="text-sm font-semibold text-green-500">NVDA +4.2%</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Top Loser</div>
              <div className="text-sm font-semibold text-red-500">TSLA -2.8%</div>
            </div>
          </div>
        </div>

        {/* Recent News */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-white">Recent News</h3>
          </div>
          <div className="space-y-4">
            <div className="group cursor-pointer">
              <div className="text-xs text-white/40 mb-1">2 hours ago • Reuters</div>
              <h4 className="text-sm font-medium text-white/80 group-hover:text-orange-500 transition-colors">Federal Reserve signals potential rate cut in upcoming quarter</h4>
            </div>
            <div className="h-px w-full bg-white/5" />
            <div className="group cursor-pointer">
              <div className="text-xs text-white/40 mb-1">4 hours ago • Bloomberg</div>
              <h4 className="text-sm font-medium text-white/80 group-hover:text-orange-500 transition-colors">Tech stocks rally as AI sector earnings beat expectations</h4>
            </div>
            <div className="h-px w-full bg-white/5" />
            <div className="group cursor-pointer">
              <div className="text-xs text-white/40 mb-1">5 hours ago • CoinDesk</div>
              <h4 className="text-sm font-medium text-white/80 group-hover:text-orange-500 transition-colors">Bitcoin ETF inflows reach new monthly high</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
