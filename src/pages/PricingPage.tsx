import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, CreditCard, HelpCircle } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { createCheckoutSession, createPortalSession } from '../services/stripe';
import { useSubscription } from '../hooks/useSubscription';
import { useSearchParams } from 'react-router-dom';

export const PricingPage = () => {
  const { tier } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(true);
  const [searchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Load monthly/annual price ids from Vite env (fallback to generic keys for backwards compatibility)
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const premiumMonthly = env.VITE_STRIPE_PREMIUM_PRICE_ID_MONTHLY || env.VITE_STRIPE_PREMIUM_PRICE_ID || '';
  const premiumAnnual = env.VITE_STRIPE_PREMIUM_PRICE_ID_ANNUAL || env.VITE_STRIPE_PREMIUM_PRICE_ID || '';
  const proMonthly = env.VITE_STRIPE_PRO_PRICE_ID_MONTHLY || env.VITE_STRIPE_PRO_PRICE_ID || '';
  const proAnnual = env.VITE_STRIPE_PRO_PRICE_ID_ANNUAL || env.VITE_STRIPE_PRO_PRICE_ID || '';

  useEffect(() => {
    if (searchParams.get('session_id')) {
      setShowSuccess(true);
      // Optional: Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleSubscribe = async (priceId: string) => {
    try {
      setCheckoutError(null);
      await createCheckoutSession(priceId);
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      setCheckoutError(message);
    }
  };

  const handleManageBilling = async () => {
    try {
      setCheckoutError(null);
      await createPortalSession();
    } catch (error: unknown) {
      console.error('Portal error:', error);
      const message = error instanceof Error ? error.message : 'Failed to open billing portal.';
      setCheckoutError(message);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-orange-500/30 font-sans pb-32">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12">
        {showSuccess && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Subscription successful! Your account is being upgraded.</p>
          </div>
        )}
        {checkoutError && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
            {checkoutError}
          </div>
        )}

        {/* Header */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold tracking-wide text-orange-400 uppercase">Upgrade Your Edge</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Simple, transparent pricing
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-white/50 mb-10">
            Start for free. Upgrade when you need institutional-grade market intelligence and unlimited AI analysis.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-white/40'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 rounded-full bg-white/10 border border-white/20 p-1 transition-colors hover:bg-white/20"
            >
              <div className={`w-6 h-6 rounded-full bg-orange-500 shadow-lg transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-white/40'}`}>
              Annually <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">SAVE 20%</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 flex flex-col hover:border-white/20 transition-colors"
          >
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <p className="text-white/50 text-sm mb-6 h-10">Perfect for retail investors getting started with tracking.</p>
            <div className="text-5xl font-extrabold mb-8">$0<span className="text-lg text-white/40 font-medium tracking-normal">/mo</span></div>
            
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20 shrink-0" /> Up to 3 exchange connections</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20 shrink-0" /> End-of-day portfolio sync</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20 shrink-0" /> 10 AI Copilot queries / month</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20 shrink-0" /> Standard market data</li>
            </ul>

            {tier === 'free' ? (
              <button disabled className="w-full py-4 rounded-xl bg-white/5 text-white/40 font-bold text-lg cursor-not-allowed border border-white/5">
                Current Plan
              </button>
            ) : (
              <button onClick={handleManageBilling} className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold text-lg">
                Downgrade
              </button>
            )}
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-orange-500/10 to-[#0A0A0A] border border-orange-500/30 flex flex-col relative hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 transform md:-translate-y-4"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2 text-orange-500">Pro</h3>
            <p className="text-white/50 text-sm mb-6 h-10">For serious traders who need real-time data and unlimited AI.</p>
            <div className="text-5xl font-extrabold mb-8">
              ${isAnnual ? '29' : '39'}<span className="text-lg text-white/40 font-medium tracking-normal">/mo</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> Unlimited exchange connections</li>
              <li className="flex items-start gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> Real-time WebSocket sync</li>
              <li className="flex items-start gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> Unlimited AI Copilot access</li>
              <li className="flex items-start gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> Advanced custom alerts (SMS/Email)</li>
              <li className="flex items-start gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> Priority support</li>
            </ul>

            {tier === 'premium' ? (
              <button onClick={handleManageBilling} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-lg border border-white/10">
                Manage Billing
              </button>
            ) : (
              <button onClick={() => handleSubscribe(isAnnual ? proAnnual || premiumAnnual : proMonthly || premiumMonthly)} className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 active:scale-95 transition-all font-bold text-white shadow-lg shadow-orange-500/25 text-lg flex items-center justify-center gap-2">
                Subscribe <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>

          {/* Premium Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 flex flex-col hover:border-white/20 transition-colors"
          >
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-white/50 text-sm mb-6 h-10">Institutional tools for fund managers and high-net-worth individuals.</p>
            <div className="text-5xl font-extrabold mb-8">
              ${isAnnual ? '99' : '129'}<span className="text-lg text-white/40 font-medium tracking-normal">/mo</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" /> Everything in Pro</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" /> API Access (Read/Write)</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" /> Custom AI model fine-tuning</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" /> Dedicated account manager</li>
              <li className="flex items-start gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" /> Export to CSV/PDF</li>
            </ul>

            {tier === 'premium' ? (
              <button onClick={handleManageBilling} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-lg border border-white/10">
                Manage Billing
              </button>
            ) : (
              <button onClick={() => handleSubscribe(isAnnual ? premiumAnnual : premiumMonthly)} className="w-full py-4 rounded-xl bg-white text-black hover:bg-gray-200 active:scale-95 transition-all font-bold text-lg">
                Subscribe
              </button>
            )}
          </motion.div>
        </div>

        {/* FAQ / Trust Section */}
        <div className="mt-32 max-w-4xl mx-auto border-t border-white/10 pt-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-8 h-8 text-orange-500 mb-4" />
              <h4 className="font-bold mb-2">Secure Payments</h4>
              <p className="text-sm text-white/50">All payments are securely processed by Stripe. We do not store your credit card information.</p>
            </div>
            <div className="flex flex-col items-center">
              <CreditCard className="w-8 h-8 text-orange-500 mb-4" />
              <h4 className="font-bold mb-2">Cancel Anytime</h4>
              <p className="text-sm text-white/50">No long-term contracts. You can cancel your subscription at any time with one click.</p>
            </div>
            <div className="flex flex-col items-center">
              <HelpCircle className="w-8 h-8 text-orange-500 mb-4" />
              <h4 className="font-bold mb-2">24/7 Support</h4>
              <p className="text-sm text-white/50">Our team is always here to help you get the most out of your FinSight AI experience.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
