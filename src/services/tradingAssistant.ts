import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export type MarketOverview = any;
export type KlineCandle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getMarketOverview() {
  const res = await fetch('/api/market/overview', { cache: 'no-store' });
  if (!res.ok) throw new Error('Market overview fetch failed');
  return res.json();
}

export async function getKlines(symbol: string, interval: string, limit = 120) {
  const res = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Klines fetch failed');
  return res.json();
}

export async function getDepth(symbol: string, limit = 20) {
  const res = await fetch(`/api/binance/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Depth fetch failed');
  return res.json();
}

export async function getRecentTrades(symbol: string, limit = 20) {
  const res = await fetch(`/api/binance/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Trades fetch failed');
  return res.json();
}

// Attempt to fetch user's portfolio from Firestore: doc users/{uid}
export async function getUserPortfolio(uid?: string) {
  if (!uid) return null;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    // Expect a `portfolio` or `assets` field; fallback to empty
    return data.portfolio ?? data.assets ?? null;
  } catch (e) {
    console.warn('Failed to fetch user portfolio', e);
    return null;
  }
}
