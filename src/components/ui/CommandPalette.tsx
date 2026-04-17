import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, ArrowRight, Zap, LineChart, Wallet, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { assets } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = [
    { id: 'dash', title: 'Go to Dashboard', icon: Zap, action: () => navigate('/dashboard') },
    { id: 'mkts', title: 'View Markets', icon: LineChart, action: () => navigate('/markets') },
    { id: 'port', title: 'My Portfolio', icon: Wallet, action: () => navigate('/wallet') },
    { id: 'ai', title: 'Ask AI Copilot', icon: MessageSquare, action: () => navigate('/copilot') },
  ];

  const filteredCommands = search === '' 
    ? commands 
    : commands.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: -20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: -20 }}
           className="bg-[#0A0A1A]/90 border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] w-full max-w-xl rounded-2xl overflow-hidden relative z-10 backdrop-blur-3xl"
        >
          <div className="flex items-center px-4 border-b border-indigo-500/20">
            <Search className="w-5 h-5 text-indigo-400 mr-3" />
            <input 
               autoFocus
               className="w-full bg-transparent border-none py-4 outline-none text-white placeholder:text-white/30 text-lg"
               placeholder="Type a command or search assets..."
               value={search}
               onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1 text-[10px] text-white/30 font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded-md">
              <Command className="w-3 h-3" /> K
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2 scrollbar-hide">
             {filteredCommands.length > 0 ? (
                 <div className="space-y-1">
                     <div className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-widest">Navigation</div>
                     {filteredCommands.map(cmd => (
                        <button 
                          key={cmd.id}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-300 text-white/80 transition-colors group"
                          onClick={() => {
                            cmd.action();
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                               <cmd.icon className="w-4 h-4" />
                             </div>
                             <span className="font-semibold">{cmd.title}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                     ))}
                 </div>
             ) : (
                 <div className="p-8 text-center text-white/40 font-medium">
                     No commands found.
                 </div>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
