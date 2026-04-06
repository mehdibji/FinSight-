import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  MessageSquare, 
  Bell, 
  LogOut,
  Wallet,
  Zap,
  Menu,
  X,
  CreditCard,
  Crown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { signOut, auth } from '../../firebase';
import { useSubscription } from '../../hooks/useSubscription';
import { createPortalSession } from '../../services/stripe';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, getTotalPortfolioValue } = useStore();
  const navigate = useNavigate();
  const { tier, isPro } = useSubscription();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'wallet', path: '/wallet', icon: Wallet, label: 'Portfolio' },
    { id: 'markets', path: '/markets', icon: PieChart, label: 'Markets' },
    { id: 'copilot', path: '/copilot', icon: MessageSquare, label: 'AI Copilot' },
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

  const totalValue = getTotalPortfolioValue();

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 bg-[#0A0A0A] border-r border-white/5 transition-transform duration-300 flex flex-col w-64",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">FinSight AI</span>
          </div>
          <button 
            className="md:hidden text-white/60 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-sm font-medium",
                isActive ? "bg-orange-500/10 text-orange-500" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          {!isPro ? (
            <button 
              onClick={() => { setIsSidebarOpen(false); navigate('/pricing'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-500/20"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </button>
          ) : (
            <button 
              onClick={handleManageBilling}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              <CreditCard className="w-5 h-5" />
              <span>Manage Billing</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-white/5 rounded-lg text-white/60 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">Total Portfolio Value</h2>
              <p className="text-lg font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold flex items-center gap-2 justify-end">
                  {user.displayName}
                  {isPro && <Crown className="w-3 h-3 text-orange-500" />}
                </div>
                <div className="text-xs text-white/40">{user.email}</div>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
