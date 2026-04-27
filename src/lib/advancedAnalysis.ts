import { sma, rsi } from './indicators';

// ============================================================
// EMA — Exponential Moving Average
// ============================================================
export function ema(values: number[], period: number): Array<number | null> {
  if (period <= 1 || values.length === 0) return values.map(v => (Number.isFinite(v) ? v : null));
  const out: Array<number | null> = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  // seed with SMA
  let sum = 0;
  for (let i = 0; i < period && i < values.length; i++) sum += values[i];
  if (values.length < period) return out;
  out[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + (out[i - 1] as number) * (1 - k);
  }
  return out;
}

// ============================================================
// MACD — Moving Average Convergence Divergence
// ============================================================
export type MACDResult = {
  macd: Array<number | null>;
  signal: Array<number | null>;
  histogram: Array<number | null>;
};

export function macd(
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  const fastEMA = ema(values, fastPeriod);
  const slowEMA = ema(values, slowPeriod);
  const macdLine: Array<number | null> = values.map((_, i) =>
    fastEMA[i] != null && slowEMA[i] != null ? (fastEMA[i] as number) - (slowEMA[i] as number) : null,
  );
  const validMACD = macdLine.filter(v => v != null) as number[];
  const signalEMA = ema(validMACD, signalPeriod);
  // Align signal back
  const signalLine: Array<number | null> = new Array(values.length).fill(null);
  let j = 0;
  for (let i = 0; i < values.length; i++) {
    if (macdLine[i] != null) {
      signalLine[i] = signalEMA[j] ?? null;
      j++;
    }
  }
  const histogram: Array<number | null> = values.map((_, i) =>
    macdLine[i] != null && signalLine[i] != null
      ? (macdLine[i] as number) - (signalLine[i] as number)
      : null,
  );
  return { macd: macdLine, signal: signalLine, histogram };
}

// ============================================================
// Bollinger Bands
// ============================================================
export type BollingerResult = {
  upper: Array<number | null>;
  middle: Array<number | null>;
  lower: Array<number | null>;
};

export function bollingerBands(values: number[], period = 20, stdDev = 2): BollingerResult {
  const middle = sma(values, period);
  const upper: Array<number | null> = new Array(values.length).fill(null);
  const lower: Array<number | null> = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = middle[i] as number;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }
  return { upper, middle, lower };
}

// ============================================================
// ATR — Average True Range
// ============================================================
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): Array<number | null> {
  const n = highs.length;
  if (n < 2) return new Array(n).fill(null);
  const tr: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < n; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  const out: Array<number | null> = new Array(n).fill(null);
  let sum = 0;
  for (let i = 0; i < period && i < n; i++) sum += tr[i];
  if (n < period) return out;
  out[period - 1] = sum / period;
  for (let i = period; i < n; i++) {
    out[i] = ((out[i - 1] as number) * (period - 1) + tr[i]) / period;
  }
  return out;
}

// ============================================================
// VWAP — Volume-Weighted Average Price
// ============================================================
export function vwap(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
): Array<number | null> {
  const n = closes.length;
  const out: Array<number | null> = new Array(n).fill(null);
  let cumTPV = 0;
  let cumVol = 0;
  for (let i = 0; i < n; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumTPV += tp * volumes[i];
    cumVol += volumes[i];
    out[i] = cumVol > 0 ? cumTPV / cumVol : null;
  }
  return out;
}

// ============================================================
// Stochastic RSI
// ============================================================
export function stochasticRSI(values: number[], rsiPeriod = 14, stochPeriod = 14): Array<number | null> {
  const rsiValues = rsi(values, rsiPeriod);
  const out: Array<number | null> = new Array(values.length).fill(null);
  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - stochPeriod + 1, i + 1).filter(v => v != null) as number[];
    if (window.length < stochPeriod) continue;
    const min = Math.min(...window);
    const max = Math.max(...window);
    const current = rsiValues[i] as number;
    out[i] = max === min ? 50 : ((current - min) / (max - min)) * 100;
  }
  return out;
}

// ============================================================
// Composite Signal Generator
// ============================================================
export type Signal = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export type SignalResult = {
  signal: Signal;
  confidence: number; // 0-100
  details: {
    rsi: { value: number | null; signal: Signal };
    macd: { value: number | null; signal: Signal };
    bollinger: { position: string; signal: Signal };
    stochRSI: { value: number | null; signal: Signal };
    trend: { direction: string; signal: Signal };
    volume: { trend: string; signal: Signal };
  };
};

export function computeSignal(
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[],
): SignalResult {
  const n = closes.length;
  const last = n - 1;

  // RSI
  const rsiVals = rsi(closes, 14);
  const lastRSI = rsiVals[last];
  const rsiSignal: Signal =
    lastRSI == null ? 'HOLD' :
    lastRSI < 20 ? 'STRONG_BUY' :
    lastRSI < 30 ? 'BUY' :
    lastRSI > 80 ? 'STRONG_SELL' :
    lastRSI > 70 ? 'SELL' : 'HOLD';

  // MACD
  const macdResult = macd(closes);
  const lastMACD = macdResult.macd[last];
  const lastSignalLine = macdResult.signal[last];
  const lastHist = macdResult.histogram[last];
  const macdSignal: Signal =
    lastHist == null ? 'HOLD' :
    lastHist > 0 && (macdResult.histogram[last - 1] ?? 0) <= 0 ? 'STRONG_BUY' :
    lastHist > 0 ? 'BUY' :
    lastHist < 0 && (macdResult.histogram[last - 1] ?? 0) >= 0 ? 'STRONG_SELL' :
    lastHist < 0 ? 'SELL' : 'HOLD';

  // Bollinger
  const bb = bollingerBands(closes, 20, 2);
  const lastClose = closes[last];
  const bbUpper = bb.upper[last];
  const bbLower = bb.lower[last];
  const bbMid = bb.middle[last];
  let bbPosition = 'middle';
  let bbSignal: Signal = 'HOLD';
  if (bbUpper != null && bbLower != null) {
    if (lastClose >= bbUpper) { bbPosition = 'above_upper'; bbSignal = 'SELL'; }
    else if (lastClose <= bbLower) { bbPosition = 'below_lower'; bbSignal = 'BUY'; }
    else if (bbMid != null && lastClose > bbMid) { bbPosition = 'upper_half'; bbSignal = 'HOLD'; }
    else { bbPosition = 'lower_half'; bbSignal = 'HOLD'; }
  }

  // Stochastic RSI
  const stochVals = stochasticRSI(closes);
  const lastStoch = stochVals[last];
  const stochSignal: Signal =
    lastStoch == null ? 'HOLD' :
    lastStoch < 10 ? 'STRONG_BUY' :
    lastStoch < 20 ? 'BUY' :
    lastStoch > 90 ? 'STRONG_SELL' :
    lastStoch > 80 ? 'SELL' : 'HOLD';

  // Trend (EMA cross)
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const lastEma20 = ema20[last];
  const lastEma50 = ema50[last];
  let trendDir = 'neutral';
  let trendSignal: Signal = 'HOLD';
  if (lastEma20 != null && lastEma50 != null) {
    if (lastEma20 > lastEma50) { trendDir = 'bullish'; trendSignal = 'BUY'; }
    else if (lastEma20 < lastEma50) { trendDir = 'bearish'; trendSignal = 'SELL'; }
  }

  // Volume trend
  const recentVol = volumes.slice(-5);
  const prevVol = volumes.slice(-10, -5);
  const avgRecent = recentVol.reduce((a, b) => a + b, 0) / (recentVol.length || 1);
  const avgPrev = prevVol.reduce((a, b) => a + b, 0) / (prevVol.length || 1);
  const volTrend = avgRecent > avgPrev * 1.2 ? 'increasing' : avgRecent < avgPrev * 0.8 ? 'decreasing' : 'stable';
  const volSignal: Signal = volTrend === 'increasing' && trendDir === 'bullish' ? 'BUY' :
    volTrend === 'increasing' && trendDir === 'bearish' ? 'SELL' : 'HOLD';

  // Composite
  const signalMap: Record<Signal, number> = { STRONG_BUY: 2, BUY: 1, HOLD: 0, SELL: -1, STRONG_SELL: -2 };
  const signals = [rsiSignal, macdSignal, bbSignal, stochSignal, trendSignal, volSignal];
  const score = signals.reduce((s, sig) => s + signalMap[sig], 0) / signals.length;

  let compositeSignal: Signal;
  if (score >= 1.2) compositeSignal = 'STRONG_BUY';
  else if (score >= 0.4) compositeSignal = 'BUY';
  else if (score <= -1.2) compositeSignal = 'STRONG_SELL';
  else if (score <= -0.4) compositeSignal = 'SELL';
  else compositeSignal = 'HOLD';

  const confidence = Math.min(100, Math.round(Math.abs(score) * 40 + 20));

  return {
    signal: compositeSignal,
    confidence,
    details: {
      rsi: { value: lastRSI, signal: rsiSignal },
      macd: { value: lastHist, signal: macdSignal },
      bollinger: { position: bbPosition, signal: bbSignal },
      stochRSI: { value: lastStoch, signal: stochSignal },
      trend: { direction: trendDir, signal: trendSignal },
      volume: { trend: volTrend, signal: volSignal },
    },
  };
}
