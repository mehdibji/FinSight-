import React, { useState, useEffect, useRef } from 'react';
import { Send, GraduationCap, Sparkles, User, Bot, Loader2, Info } from 'lucide-react';
import { getGeminiResponse, ChatMessage } from '../../services/gemini';
import * as TA from '../../services/tradingAssistant';
import { auth } from '../../firebase';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { useSubscription } from '../../hooks/useSubscription';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEducationalMode, setIsEducationalMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { assets, alerts } = useStore();
  const { tier, isPro } = useSubscription();

  const suggestedPrompts = [
    "Analyze my portfolio risk",
    "Summarize today's market sentiment",
    "What should I watch this week?",
    "Explain BTC volatility simply",
    "Compare S&P 500 vs Nasdaq"
  ];

  const quickActions = [
    { id: 'check_btc', label: 'Check BTC' },
    { id: 'top_movers', label: 'Top movers' },
    { id: 'my_portfolio', label: 'My portfolio' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Enrich prompt with live market + portfolio context
      let portfolio = assets;
      try {
        const uid = auth.currentUser?.uid;
        const remote = await TA.getUserPortfolio(uid);
        if (remote && Array.isArray(remote)) {
          portfolio = remote as any;
        }
      } catch (err) {
        // ignore
      }

      // fetch a small market snapshot
      let marketSnapshot: any = null;
      try {
        marketSnapshot = await TA.getMarketOverview();
      } catch (err) {
        marketSnapshot = null;
      }

      const marketContext = marketSnapshot ? `Market snapshot: ${JSON.stringify(marketSnapshot.crypto ?? {})}` : "";
      const prompt = `${marketContext}\nQuestion: ${text}`;

      const response = await getGeminiResponse(prompt, messages, isEducationalMode, portfolio, alerts);
      const aiText = response || 'Sorry, I encountered an error.';

      // Stream/typing effect: append empty model message and fill progressively
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      let idx = 0;
      const chunkSize = 40;
      while (idx < aiText.length) {
        const next = aiText.slice(0, idx + chunkSize);
        setMessages(prev => {
          const copy = [...prev];
          // replace last model message
          const lastIndex = copy.map(m => m.role).lastIndexOf('model');
          if (lastIndex >= 0) copy[lastIndex] = { role: 'model', text: next };
          return copy;
        });
        idx += chunkSize;
        // small pause to simulate typing
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 120));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuick = async (id: string) => {
    if (id === 'check_btc') return handleSend('What is BTC doing?');
    if (id === 'top_movers') return handleSend('Top gainers today');
    if (id === 'my_portfolio') return handleSend('Show my portfolio');
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
            <p className="text-[10px] text-white/50">Gemini 3.1 Pro Powered</p>
          </div>
        </div>

        <button
          onClick={() => setIsEducationalMode(!isEducationalMode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            isEducationalMode 
              ? "bg-orange-500/20 text-orange-500 border border-orange-500/50" 
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          )}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {isEducationalMode ? 'Educational Mode: ON' : 'Educational Mode'}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">How can I help you today?</h4>
              <p className="text-sm text-white/40">
                Ask about market trends, portfolio risk, or activate Educational Mode for simplified learning.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-3">
              {quickActions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleQuick(a.id)}
                  className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                msg.role === 'user' ? "bg-white/10" : "bg-orange-500/20"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white/60" /> : <Bot className="w-4 h-4 text-orange-500" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-orange-500 text-white rounded-tr-none" 
                  : "bg-white/5 text-white/80 border border-white/10 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white/5 text-white/40 text-sm border border-white/10 rounded-tl-none italic">
              Analyzing markets...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/5 border-t border-white/10 relative">
        {/* Removed Paywall UI */}

        <div className="relative mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isEducationalMode ? "Ask for a simple explanation..." : "Analyze market sentiment..."}
            disabled={isLoading}
            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/30 px-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            <span>AI can make mistakes. Not financial advice.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
