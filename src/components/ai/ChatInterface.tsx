import React, { Suspense, lazy, useMemo, useState, useEffect, useRef } from 'react';
import { Send, GraduationCap, Sparkles, User, Bot, Loader2, Info, Copy, RefreshCw, ThumbsUp, ThumbsDown, LineChart, Globe, Target, Activity, Clock, FileText } from 'lucide-react';
import { getGeminiResponse, ChatMessage } from '../../services/gemini';
import * as TA from '../../services/tradingAssistant';
import { auth, db } from '../../firebase';
import { doc, getDoc } from "firebase/firestore";
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { useLocation, useNavigate } from 'react-router-dom';
const MarkdownRenderer = lazy(() =>
  import("./MarkdownRenderer").then((m) => ({ default: m.MarkdownRenderer })),
);

export const ChatInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPromptConsumed = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEducationalMode, setIsEducationalMode] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { assets, alerts } = useStore();

  const suggestedPrompts = [
    "Analyze My Portfolio",
    "Summarize today's market sentiment",
    "What should I watch this week?",
    "Explain BTC volatility simply",
    "Compare S&P 500 vs Nasdaq"
  ];

  const quickActions = [
    { id: 'analyze_portfolio', label: 'Analyze My Portfolio' },
    { id: 'market_sentiment', label: 'Market sentiment' },
    { id: 'trading_ideas', label: 'Trading ideas' },
  ];

  const advancedTools = [
    { id: 'ta', icon: LineChart, label: 'Tech Analysis', prompt: 'Perform a technical analysis on BTC' },
    { id: 'social', icon: Globe, label: 'Social Sentiment', prompt: 'What is the current social sentiment for crypto?' },
    { id: 'news', icon: FileText, label: 'News Impact', prompt: 'Analyze recent macro news impact on markets' },
    { id: 'screener', icon: Target, label: 'Screener', prompt: 'Screen for oversold assets with high volume' },
    { id: 'backtest', icon: Activity, label: 'Backtest', prompt: 'Simulate a simple SMA crossover strategy on ETH' },
    { id: 'projection', icon: Clock, label: 'Projection', prompt: 'Give me a 24h price projection for BTC' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        console.log(data);
        setUserPlan((data.plan as string) || 'free');
      }
    };

    fetchUserData().catch((error) => {
      console.error("Failed to fetch user data", error);
    });
  }, []);

  const proactiveSuggestions = useMemo(() => {
    const hasHighRiskAlert = alerts.some((a) => a.active);
    return [
      "BTC is trending up with positive momentum across major pairs.",
      hasHighRiskAlert
        ? "Your portfolio risk is high due to active alerts. Consider reducing concentration."
        : "Your portfolio risk is moderate. You can rebalance to reduce volatility.",
    ];
  }, [alerts]);

  useEffect(() => {
    if (messages.length > 0) return;
    const timer = window.setTimeout(() => {
      setMessages([
        {
          role: "model",
          text: `Proactive update:\n- ${proactiveSuggestions[0]}\n- ${proactiveSuggestions[1]}`,
        },
      ]);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [messages.length, proactiveSuggestions]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let portfolio = assets;
      try {
        const uid = auth.currentUser?.uid;
        const remote = await TA.getUserPortfolio(uid);
        if (remote && Array.isArray(remote)) {
          portfolio = remote as any;
        }
      } catch (err) {}

      let marketSnapshot: any = null;
      try {
        marketSnapshot = await TA.getMarketOverview();
      } catch (err) {}

      const marketContext = marketSnapshot ? `Market snapshot: ${JSON.stringify(marketSnapshot.crypto ?? {})}` : "";
      const prompt = `${marketContext}\nQuestion: ${text}`;

      const response = await getGeminiResponse(prompt, messages, isEducationalMode, portfolio, alerts);
      const aiText = response || 'Sorry, I encountered an error.';

      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      let idx = 0;
      const chunkSize = 40;
      while (idx < aiText.length) {
        const next = aiText.slice(0, idx + chunkSize);
        setMessages(prev => {
          const copy = [...prev];
          const lastIndex = copy.map(m => m.role).lastIndexOf('model');
          if (lastIndex >= 0) copy[lastIndex] = { role: 'model', text: next };
          return copy;
        });
        idx += chunkSize;
        await new Promise((r) => setTimeout(r, 60));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  useEffect(() => {
    const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt;
    if (!initialPrompt || initialPromptConsumed.current) return;
    initialPromptConsumed.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void handleSendRef.current(initialPrompt);
  }, [location.pathname, location.state, navigate]);

  const handlePremiumAction = (prompt: string) => {
    if (userPlan !== "pro") {
      alert("Upgrade to premium");
      return;
    }
    handleSend(prompt);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRegen = (idx: number) => {
    // Implement regeneration logic based on history
    // For simplicity, just pop the last AI msg and re-send the last user msg
    const newMsgs = messages.slice(0, idx);
    const lastUser = newMsgs[newMsgs.length - 1];
    if (lastUser && lastUser.role === 'user') {
      setMessages(newMsgs.slice(0, newMsgs.length - 1));
      handleSend(lastUser.text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050512]/60 backdrop-blur-[40px] border border-indigo-500/15 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.05)]">
      {/* Header */}
      <div className="p-5 border-b border-indigo-500/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-orange-500 flex items-center justify-center p-[1px]">
             <div className="w-full h-full bg-[#050512] rounded-full flex items-center justify-center">
               <Sparkles className="w-5 h-5 text-orange-400" />
             </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Copilot</h3>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">Gemini 3.1 Pro Powered</p>
          </div>
        </div>

        <button
          onClick={() => setIsEducationalMode(!isEducationalMode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
            isEducationalMode 
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
          )}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {isEducationalMode ? 'Edu Mode: ON' : 'Edu Mode'}
        </button>
      </div>

      {/* Advanced Tools bar */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-indigo-500/10 bg-black/20 scrollbar-hide">
        {advancedTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => handlePremiumAction(tool.prompt)}
            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all font-medium text-[11px] text-white/70 hover:text-indigo-300"
          >
            <tool.icon className="w-3.5 h-3.5" />
            {tool.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide relative z-10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-orange-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
            >
              <Bot className="w-8 h-8 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            </motion.div>
            <div>
              <h4 className="text-white font-bold text-lg mb-2">Trading Copilot Online</h4>
              <p className="text-sm text-white/40 max-w-sm">
                I can proactively flag momentum shifts, portfolio risk, and tactical opportunities.
              </p>
            </div>
            <div className="w-full max-w-lg rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3 text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-300">Proactive Suggestions</p>
              <ul className="space-y-1 text-xs text-white/70">
                {proactiveSuggestions.map((suggestion, idx) => (
                  <li key={idx}>- {suggestion}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/60 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-3">
              {quickActions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSend(a.label)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[90%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto group"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border",
                msg.role === 'user' 
                  ? "bg-gradient-to-br from-orange-500 to-rose-600 border-white/10" 
                  : "bg-[#0A0A1A] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
              </div>

              <div className="flex flex-col gap-2">
                <div className={cn(
                  "p-4 rounded-3xl text-sm leading-relaxed shadow-lg relative",
                  msg.role === 'user' 
                    ? "bg-gradient-to-r from-orange-600 to-rose-500 text-white rounded-tr-none" 
                    : "bg-[#0A0A1A]/80 backdrop-blur-md text-white/90 border border-indigo-500/20 rounded-tl-none shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                )}>
                  {msg.role === 'model' ? (
                    <Suspense fallback={<div className="text-white/70">{msg.text}</div>}>
                      <MarkdownRenderer text={msg.text} />
                    </Suspense>
                  ) : (
                    msg.text
                  )}
                  {msg.role === 'model' && i === messages.length - 1 && isLoading && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-orange-500 animate-pulse" />
                  )}
                </div>

                {/* AI Actions */}
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    <button onClick={() => handleCopy(msg.text)} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white" title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRegen(i)} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white" title="Regenerate">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-white/10 mx-1" />
                    <button className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-emerald-400" title="Good">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-rose-400" title="Bad">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 mr-auto">
            <div className="w-8 h-8 rounded-full bg-[#0A0A1A] border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl bg-[#0A0A1A]/80 text-orange-400/80 text-sm border border-indigo-500/20 rounded-tl-none italic font-medium flex items-center gap-2">
               Processing intelligence
               <span className="flex gap-1">
                 <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
               </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 bg-black/40 border-t border-indigo-500/20 backdrop-blur-3xl z-20">
        <div className="relative mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isEducationalMode ? "Ask for a simple explanation..." : "Command the market matrix..."}
            disabled={isLoading}
            className="w-full bg-[#0A0A1A] border border-indigo-500/30 rounded-2xl py-3.5 pl-5 pr-14 text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/70 focus:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/30 px-2 font-semibold tracking-wide">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI models can hallucinate. Verify critical data.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
