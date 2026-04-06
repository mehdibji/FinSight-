import React, { useState, useEffect, useRef } from 'react';
import { Send, GraduationCap, Sparkles, User, Bot, Loader2, Info } from 'lucide-react';
import { getGeminiResponse, ChatMessage } from '../../services/gemini';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { Paywall } from '../ui/Paywall';
import { useSubscription } from '../../hooks/useSubscription';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEducationalMode, setIsEducationalMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { assets, alerts } = useStore();
  const { tier, isPro } = useSubscription();

  const FREE_TIER_LIMIT = 3;
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const hitPaywall = !isPro && userMessageCount >= FREE_TIER_LIMIT;

  const suggestedPrompts = [
    "Analyze my portfolio risk",
    "Summarize today's market sentiment",
    "What should I watch this week?",
    "Explain BTC volatility simply",
    "Compare S&P 500 vs Nasdaq"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading || hitPaywall) return;

    const userMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(text, messages, isEducationalMode, assets, alerts);
      const aiMessage: ChatMessage = { role: 'model', text: response || 'Sorry, I encountered an error.' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
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
        {hitPaywall ? (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Paywall 
              requiredTier="pro" 
              title="Daily Limit Reached" 
              description="You've used your 3 free AI Copilot queries. Upgrade to Pro for unlimited institutional-grade analysis."
            >
              <div />
            </Paywall>
          </div>
        ) : null}

        <div className="relative mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isEducationalMode ? "Ask for a simple explanation..." : "Analyze market sentiment..."}
            disabled={hitPaywall}
            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim() || hitPaywall}
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
          {!isPro && (
            <span className="font-mono text-orange-500/80">
              {FREE_TIER_LIMIT - userMessageCount} queries left
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
