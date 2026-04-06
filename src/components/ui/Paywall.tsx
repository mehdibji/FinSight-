import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription, SubscriptionTier } from '../../hooks/useSubscription';

interface PaywallProps {
  children: React.ReactNode;
  requiredTier: 'pro' | 'premium';
  title?: string;
  description?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ 
  children, 
  requiredTier, 
  title = "Unlock Pro Features", 
  description = "Upgrade your account to access advanced market intelligence and unlimited AI queries." 
}) => {
  const { tier, loading, isPro, isPremium } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#0A0A0A] rounded-2xl border border-white/5">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccess = requiredTier === 'pro' ? isPro : isPremium;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden group">
      {/* Blurred Content Behind */}
      <div className="absolute inset-0 blur-md opacity-30 pointer-events-none select-none overflow-hidden">
        {children}
      </div>

      {/* Paywall Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3 text-center">{title}</h3>
        <p className="text-white/60 text-center max-w-md mb-8 leading-relaxed">
          {description}
        </p>

        <button 
          onClick={() => navigate('/pricing')}
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <Zap className="w-4 h-4" /> View Pricing Plans
        </button>
      </div>
    </div>
  );
};
