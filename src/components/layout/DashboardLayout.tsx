import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  PieChart, 
  MessageSquare, 
  Bell, 
  Wallet,
  Zap,
  LogOut,
  CreditCard,
  Crown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { signOut, auth } from '../../firebase';
import { useSubscription } from '../../hooks/useSubscription';
import { createPortalSession } from '../../services/stripe';
import { motion, AnimatePresence } from 'motion/react';

export const DashboardLayout = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro } = useSubscription();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: Zap, label: 'Cockpit' },
    { id: 'markets', path: '/markets', icon: PieChart, label: 'Markets' },
    { id: 'wallet', path: '/wallet', icon: Wallet, label: 'Portfolio' },
    { id: 'copilot', path: '/copilot', icon: MessageSquare, label: 'AI' },
    { id: 'alerts', path: '/alerts', icon: Bell, label: 'Signals' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      await createPortalSession();
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal.');
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-[#030305] text-[#E0E2F0] overflow-hidden font-sans relative">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Top Bar */}
      <header className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start">
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden sm:block">FinSight</span>
        </div>

        <div className="flex gap-3">
          {!isPro ? (
            <button 
              onClick={() => navigate('/pricing')}
              className="glass-floating flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-orange-400 hover:text-orange-300"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          ) : (
             <button 
              onClick={handleManageBilling}
              className="glass px-3 py-2 rounded-2xl text-white/70 hover:text-white"
              title="Manage Billing"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          <div className="glass-panel flex items-center gap-3 p-1 pr-4 rounded-2xl">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full ml-1"
              referrerPolicy="no-referrer"
            />
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white">{user.displayName}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full pt-20 pb-28 px-4 sm:px-8 overflow-y-auto scrollbar-hide"
          >
            <div className="max-w-[1600px] mx-auto h-full">
              <Outlet />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel px-2 py-2 rounded-3xl flex items-center gap-1 sm:gap-2 shadow-2xl shadow-black/50 border border-white/10 backdrop-blur-3xl">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "relative px-4 py-3 sm:px-6 rounded-2xl flex flex-col items-center gap-1 sm:flex-row transition-all duration-300",
                  isActive ? "text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute inset-0 bg-white/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10", isActive && "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]")} />
                <span className={cn("text-xs font-semibold relative z-10 hidden sm:block", isActive && "text-white")}>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

    </div>
  );
};
