import React, { useState, useEffect } from 'react';
import { X, Wallet, Check, AlertCircle, Key, Link2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  WALLET_PROVIDERS,
  type WalletProvider,
  type ConnectedWallet,
  connectMetaMask,
  connectCoinbase,
  connectPhantom,
  connectBinance,
  connectManual,
  getSavedWallets,
  saveWallets,
  removeWallet,
} from '../../services/walletProviders';
import { auth } from '../../firebase';

interface WalletConnectHubProps {
  open: boolean;
  onClose: () => void;
  onWalletsChange?: (wallets: ConnectedWallet[]) => void;
}

export const WalletConnectHub = ({ open, onClose, onWalletsChange }: WalletConnectHubProps) => {
  const [wallets, setWallets] = useState<ConnectedWallet[]>(getSavedWallets());
  const [connecting, setConnecting] = useState<WalletProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBinanceForm, setShowBinanceForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualChain, setManualChain] = useState('Ethereum');

  useEffect(() => {
    onWalletsChange?.(wallets);
  }, [wallets, onWalletsChange]);

  const updateWallets = (newWallets: ConnectedWallet[]) => {
    setWallets(newWallets);
    saveWallets(newWallets);
  };

  const handleConnect = async (provider: WalletProvider) => {
    setError(null);
    if (provider === 'binance') { setShowBinanceForm(true); return; }
    if (provider === 'manual') { setShowManualForm(true); return; }
    if (provider === 'trust') { setError('Trust Wallet via WalletConnect coming soon.'); return; }

    setConnecting(provider);
    try {
      let wallet: ConnectedWallet | null = null;
      switch (provider) {
        case 'metamask': wallet = await connectMetaMask(); break;
        case 'coinbase': wallet = await connectCoinbase(); break;
        case 'phantom': wallet = await connectPhantom(); break;
      }
      if (wallet) {
        const exists = wallets.some(w => w.address.toLowerCase() === wallet!.address.toLowerCase());
        if (exists) { setError('This wallet is already connected.'); }
        else { updateWallets([...wallets, wallet]); }
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const handleBinanceConnect = async () => {
    if (!binanceKey || !binanceSecret) return;
    setConnecting('binance');
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Please sign in first');
      const wallet = await connectBinance(binanceKey, binanceSecret, idToken);
      if (wallet) updateWallets([...wallets, wallet]);
      setShowBinanceForm(false);
      setBinanceKey('');
      setBinanceSecret('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleManualConnect = () => {
    if (!manualAddress) return;
    const wallet = connectManual(manualAddress, manualChain);
    const exists = wallets.some(w => w.address.toLowerCase() === wallet.address.toLowerCase());
    if (exists) { setError('This address is already tracked.'); return; }
    updateWallets([...wallets, wallet]);
    setShowManualForm(false);
    setManualAddress('');
  };

  const handleDisconnect = (id: string) => {
    const updated = removeWallet(id);
    setWallets(updated);
  };

  if (!open) return null;

  const providerEntries = Object.entries(WALLET_PROVIDERS) as [WalletProvider, typeof WALLET_PROVIDERS[WalletProvider]][];
  const connected = wallets.map(w => w.provider);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-[#0A0A1A]/95 border border-indigo-500/20 rounded-3xl overflow-hidden relative z-10 backdrop-blur-3xl shadow-[0_0_80px_rgba(99,102,241,0.15)] max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-indigo-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Connect Wallets</h2>
                <p className="text-xs text-white/40">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Connected Wallets */}
            {wallets.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 px-1">Connected</div>
                {wallets.map(w => {
                  const info = WALLET_PROVIDERS[w.provider];
                  return (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{info.icon}</span>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {info.name}
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">{w.chain}</span>
                          </div>
                          <div className="text-[11px] text-white/50 font-mono">{w.address.slice(0, 6)}...{w.address.slice(-4)}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDisconnect(w.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Provider Cards */}
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 px-1">Available Providers</div>
            {providerEntries.map(([key, info]) => {
              const isConnected = connected.includes(key);
              const isConnecting = connecting === key;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => !isConnected && handleConnect(key)}
                  disabled={isConnecting || !info.available}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                    isConnected
                      ? "bg-white/[0.02] border-emerald-500/20 opacity-60"
                      : info.available
                        ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                        : "bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${info.color}15`, border: `1px solid ${info.color}30` }}>
                      {info.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {info.name}
                        {!info.available && <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30 uppercase">Soon</span>}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{info.description}</div>
                      <div className="flex gap-1 mt-1.5">
                        {info.chains.slice(0, 4).map(chain => (
                          <span key={chain} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30 font-medium">{chain}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {isConnected ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : isConnecting ? (
                      <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Link2 className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                </motion.button>
              );
            })}

            {/* Binance API Form */}
            <AnimatePresence>
              {showBinanceForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold"><Key className="w-4 h-4" /> Binance API Key (Read-Only)</div>
                    <input value={binanceKey} onChange={e => setBinanceKey(e.target.value)} placeholder="API Key" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" />
                    <input value={binanceSecret} onChange={e => setBinanceSecret(e.target.value)} placeholder="API Secret" type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" />
                    <div className="flex gap-2">
                      <button onClick={handleBinanceConnect} disabled={!binanceKey || !binanceSecret} className="flex-1 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40">Connect</button>
                      <button onClick={() => setShowBinanceForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-bold text-sm">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Address Form */}
            <AnimatePresence>
              {showManualForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                    <div className="text-sm font-bold text-white/80">Track Wallet Address</div>
                    <select value={manualChain} onChange={e => setManualChain(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none appearance-none">
                      <option value="Ethereum">Ethereum</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Solana">Solana</option>
                      <option value="Polygon">Polygon</option>
                      <option value="BSC">BSC</option>
                    </select>
                    <input value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="Wallet address (0x...)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-mono focus:border-indigo-500/50" />
                    <div className="flex gap-2">
                      <button onClick={handleManualConnect} disabled={!manualAddress} className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-bold text-sm disabled:opacity-40">Track Address</button>
                      <button onClick={() => setShowManualForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-bold text-sm">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
