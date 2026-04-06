import React from 'react';
import { Zap, ChevronRight, ShieldCheck, Wallet, PieChart, MessageSquare, Bell, Lock, Server, Key, EyeOff, Activity, ArrowRight, CheckCircle2, BarChart3, BrainCircuit, TrendingUp, Globe, Cpu, LineChart, Twitter, Github, Linkedin, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, auth, googleProvider } from '../firebase';

export const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-orange-500/30 font-sans">
      {/* Advanced Background with Grid & Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      {/* Production Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FinSight AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60 bg-white/[0.03] px-6 py-2 rounded-full border border-white/5">
          <a href="#platform" className="hover:text-white transition-colors">Platform</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Wall of Love</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogin} className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors">
            Log in
          </button>
          <button onClick={handleLogin} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Start Free Trial
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8 backdrop-blur-sm cursor-pointer hover:bg-orange-500/20 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-orange-400">FinSight Copilot 2.0 is now available</span>
              <ArrowRight className="w-3 h-3 text-orange-400" />
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
              Institutional edge. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-orange-500">Retail simplicity.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              The AI-native terminal that connects your exchanges, analyzes your risk, and uncovers market opportunities in real-time.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={handleLogin}
                className="group w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
              >
                Connect Portfolio <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={handleLogin}
                className="w-full sm:w-auto bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                Book a Demo
              </button>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-[#050505]" />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60 font-medium">
                <div className="flex gap-1 text-orange-500">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span>Trusted by 10,000+ modern investors</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Dashboard UI Mockup (Realistic DOM) */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#0A0A0A] group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-20 pointer-events-none" />
            
            {/* Window Chrome */}
            <div className="h-12 bg-[#111] border-b border-white/5 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="px-4 py-1 rounded-md bg-black/50 border border-white/5 text-xs text-white/40 font-mono flex items-center gap-2">
                <Lock className="w-3 h-3" /> app.finsight.ai
              </div>
              <div className="w-16" /> {/* Spacer */}
            </div>

            {/* App Content Mock */}
            <div className="flex h-[500px] bg-[#0A0A0A]">
              {/* Sidebar Mock */}
              <div className="w-64 border-r border-white/5 p-4 hidden md:flex flex-col gap-2 bg-[#050505]/50">
                <div className="h-8 w-32 bg-white/10 rounded mb-4" />
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-full bg-white/5 rounded-lg" />)}
                <div className="mt-auto h-24 w-full bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-orange-500/50 rounded" />
                  <div className="h-6 w-24 bg-orange-500/80 rounded" />
                </div>
              </div>
              
              {/* Main Content Mock */}
              <div className="flex-1 p-8 overflow-hidden relative">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <div className="h-4 w-24 bg-white/20 rounded mb-2" />
                    <div className="h-10 w-48 bg-white/90 rounded" />
                  </div>
                  <div className="h-10 w-32 bg-green-500/20 rounded" />
                </div>
                
                {/* Chart Area Mock */}
                <div className="h-64 w-full border border-white/5 rounded-xl bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden mb-6">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="rgba(249,115,22,0.1)" />
                    <path d="M0,50 Q25,30 50,60 T100,20" fill="none" stroke="rgba(249,115,22,0.8)" strokeWidth="0.5" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                      <div className="h-3 w-16 bg-white/20 rounded mb-4" />
                      <div className="h-6 w-24 bg-white/60 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Integrations Banner */}
        <section id="integrations" className="border-y border-white/5 bg-white/[0.02] py-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center mb-8">
            <p className="text-sm font-bold tracking-widest uppercase text-white/40">Connects seamlessly with your existing stack</p>
          </div>
          <div className="flex justify-center flex-wrap gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 max-w-5xl mx-auto px-6">
            {['Binance', 'Coinbase', 'Kraken', 'Plaid', 'Interactive Brokers', 'Robinhood'].map((name) => (
              <div key={name} className="text-xl md:text-2xl font-black tracking-tighter text-white/80">{name}</div>
            ))}
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="platform" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">A terminal built for the AI era</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">Everything you need to analyze, track, and execute, powered by context-aware artificial intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
            {/* Large Card: AI Copilot */}
            <div className="md:col-span-2 lg:col-span-2 row-span-2 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                  <BrainCircuit className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Your personal quant</h3>
                <p className="text-white/50 text-lg mb-8 max-w-md">Ask complex questions about your portfolio. The AI understands your holdings, risk tolerance, and real-time market conditions.</p>
                
                {/* Mini Chat UI Mock */}
                <div className="mt-auto bg-[#111] rounded-2xl border border-white/5 p-4 space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-500 shrink-0" />
                    <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-white/80">
                      If BTC drops 10% today, how does it affect my overall portfolio?
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 shrink-0 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl rounded-tl-none p-3 text-sm text-white/90">
                      Based on your current allocation (45% BTC, 55% Equities), a 10% BTC drop would result in a <strong>4.5% total portfolio drawdown</strong>. Your beta to BTC is currently 0.65.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Card: Real-time Data */}
            <div className="md:col-span-1 lg:col-span-2 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="relative z-10">
                <Activity className="w-8 h-8 text-white/80 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Millisecond precision</h3>
                <p className="text-white/50">Live WebSockets stream data directly to your dashboard. Never refresh again.</p>
              </div>
              {/* Abstract Data Viz */}
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-green-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 w-full h-full border-t border-green-500/50 transform translate-y-1/2 rotate-[-5deg]" />
                <div className="absolute bottom-0 w-full h-full border-t border-green-500/30 transform translate-y-1/4 rotate-[2deg]" />
              </div>
            </div>

            {/* Small Card: Security */}
            <div className="rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div>
                <ShieldCheck className="w-8 h-8 text-white/80 mb-4" />
                <h3 className="text-xl font-bold mb-2">Read-only access</h3>
                <p className="text-white/50 text-sm">We can't move your funds. Period.</p>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600" />
              </div>
            </div>

            {/* Small Card: Alerts */}
            <div className="rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div>
                <Bell className="w-8 h-8 text-white/80 mb-4" />
                <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
                <p className="text-white/50 text-sm">Get notified before the trend breaks.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-white/70">BTC Volatility Spike</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials / Wall of Love */}
        <section id="testimonials" className="py-32 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Loved by serious investors</h2>
              <p className="text-xl text-white/50">Don't just take our word for it.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Alex Chen", role: "Crypto Fund Manager", text: "FinSight replaced 3 different tools for us. The AI copilot's ability to instantly calculate portfolio beta against specific assets is mind-blowing." },
                { name: "Sarah Jenkins", role: "Retail Investor", text: "Finally, a dashboard that doesn't look like it was built in 1995. The real-time alerts saved me from a massive drawdown last week." },
                { name: "Marcus Thorne", role: "Day Trader", text: "The read-only API integration took 2 minutes. Now I have a unified view of my Binance, Kraken, and traditional brokerage accounts." }
              ].map((t, i) => (
                <div key={i} className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl">
                  <div className="flex gap-1 text-orange-500 mb-6">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-white/80 text-lg mb-8 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <img src={`https://i.pravatar.cc/150?img=${i + 30}`} alt={t.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <h4 className="font-bold text-white">{t.name}</h4>
                      <p className="text-sm text-white/40">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Transparent pricing</h2>
            <p className="text-xl text-white/50">Start for free, upgrade when you need institutional power.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="p-10 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-colors flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <p className="text-white/50 mb-6">Perfect for getting started.</p>
              <div className="text-5xl font-extrabold mb-8">$0<span className="text-lg text-white/40 font-medium tracking-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20" /> Up to 3 exchange connections</li>
                <li className="flex items-center gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20" /> End-of-day portfolio sync</li>
                <li className="flex items-center gap-3 text-white/80"><CheckCircle2 className="w-5 h-5 text-white/20" /> 10 AI Copilot queries / month</li>
              </ul>
              <button onClick={handleLogin} className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all font-bold text-lg">
                Start Free
              </button>
            </div>
            
            <div className="p-10 rounded-3xl bg-gradient-to-b from-orange-500/10 to-[#0A0A0A] border border-orange-500/30 relative hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 flex flex-col">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
                PRO
              </div>
              <h3 className="text-2xl font-bold mb-2 text-orange-500">Institutional</h3>
              <p className="text-white/50 mb-6">For serious traders and funds.</p>
              <div className="text-5xl font-extrabold mb-8">$29<span className="text-lg text-white/40 font-medium tracking-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500" /> Unlimited connections</li>
                <li className="flex items-center gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500" /> Real-time WebSocket sync</li>
                <li className="flex items-center gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500" /> Unlimited AI Copilot access</li>
                <li className="flex items-center gap-3 text-white/90"><CheckCircle2 className="w-5 h-5 text-orange-500" /> Custom SMS/Email alerts</li>
              </ul>
              <button onClick={handleLogin} className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all font-bold text-white shadow-lg shadow-orange-500/25 text-lg">
                Start 14-Day Trial
              </button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-orange-500/20 via-[#0A0A0A] to-[#0A0A0A] border border-orange-500/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Stop trading in the dark.</h2>
              <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">Join the next generation of investors using AI to find their edge.</p>
              <button 
                onClick={handleLogin}
                className="bg-white text-black px-10 py-5 rounded-full text-xl font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] inline-flex items-center gap-2"
              >
                Create Free Account <ArrowUpRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Production Footer */}
      <footer className="border-t border-white/10 bg-[#050505] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">FinSight AI</span>
              </div>
              <p className="text-white/40 text-sm mb-6 max-w-xs leading-relaxed">
                The intelligent operating system for modern investors. Track, analyze, and execute with confidence.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-white/40 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-white/40 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white/90">Product</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white/90">Resources</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white/90">Legal</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} FinSight AI Inc. All rights reserved.
            </p>
            <p className="text-xs text-white/30 max-w-2xl text-center md:text-right">
              <strong>Disclaimer:</strong> Not financial advice. Information generated by AI is for educational purposes only. Cryptocurrency and stock investments carry high risk.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
