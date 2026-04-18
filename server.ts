import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import admin from "firebase-admin";
import { createServer as createHttpServer } from "node:http";
import net from "node:net";

// Support local development secrets in the same place the README documents.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config({ path: "API.env" });

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.trim()
  .replace(/^"(.*)"$/s, "$1")
  .replace(/\\n/g, "\n");
const hasFirebaseServiceAccount =
  Boolean(firebaseProjectId) && Boolean(firebaseClientEmail) && Boolean(firebasePrivateKey);
let firebaseAdminReady = false;

if (!admin.apps.length) {
  try {
    if (hasFirebaseServiceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
      firebaseAdminReady = true;
    } else {
      console.warn("Firebase Admin service account env vars are missing.");
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

if (!firebaseAdminReady && admin.apps.length > 0) {
  firebaseAdminReady = true;
}
const db = firebaseAdminReady ? admin.firestore() : null;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

// Support distinct monthly/annual price ids for Pro & Premium tiers
const stripePremiumMonthly = process.env.STRIPE_PREMIUM_PRICE_ID_MONTHLY;
const stripePremiumAnnual = process.env.STRIPE_PREMIUM_PRICE_ID_ANNUAL;
const stripeProMonthly = process.env.STRIPE_PRO_PRICE_ID_MONTHLY;
const stripeProAnnual = process.env.STRIPE_PRO_PRICE_ID_ANNUAL;

const allowedPriceIds = new Set(
  [stripePremiumMonthly, stripePremiumAnnual, stripeProMonthly, stripeProAnnual].filter(Boolean) as string[],
);

type AuthedRequest = express.Request & { firebaseUid?: string };
type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FIREBASE_ADMIN_MISCONFIGURED"
  | "STRIPE_NOT_CONFIGURED"
  | "INVALID_PRICE_ID"
  | "INVALID_ORIGIN"
  | "INTERNAL_SERVER_ERROR"
  | "CUSTOMER_ID_REQUIRED";

function sendApiError(
  res: express.Response,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  return res.status(status).json({ error: code, message });
}

function sendStructuredError(
  res: express.Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

async function verifyFirebaseAuth(
  req: AuthedRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return sendApiError(res, 401, "UNAUTHORIZED", "Authentication token is required.");
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();
  if (!token) {
    return sendApiError(res, 401, "UNAUTHORIZED", "Authentication token is required.");
  }

  if (!firebaseAdminReady || !admin.apps.length) {
    return sendApiError(
      res,
      500,
      "FIREBASE_ADMIN_MISCONFIGURED",
      "Firebase Admin SDK is not initialized.",
    );
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Firebase auth error.";
    console.error("Firebase token verification failed", message);
    if (message.includes("Project Id")) {
      return sendApiError(
        res,
        500,
        "FIREBASE_ADMIN_MISCONFIGURED",
        "Firebase Admin is misconfigured on the server.",
      );
    }
    return sendApiError(res, 401, "UNAUTHORIZED", "Invalid authentication token.");
  }
}

type StooqDailyQuote = {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

function parseStooqCsvLine(line: string): StooqDailyQuote | null {
  // Format (single line): SYMBOL,YYYYMMDD,HHMMSS,OPEN,HIGH,LOW,CLOSE,VOLUME,...
  const parts = line.trim().split(",");
  if (parts.length < 7) return null;
  const symbol = parts[0];
  const open = Number.parseFloat(parts[3]);
  const high = Number.parseFloat(parts[4]);
  const low = Number.parseFloat(parts[5]);
  const close = Number.parseFloat(parts[6]);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return null;
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null;
  return { symbol, open, high, low, close };
}

async function fetchStooqDaily(symbol: string): Promise<StooqDailyQuote | null> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const text = await fetch(url).then((r) => r.text());
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)[0];
  if (!line) return null;
  return parseStooqCsvLine(line);
}

async function getAvailablePort(preferredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        resolve(getAvailablePort(0));
        return;
      }
      reject(error);
    });

    server.once("listening", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : preferredPort;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(port);
      });
    });

    server.listen(preferredPort, "0.0.0.0");
  });
}

async function startServer() {
  const app = express();
  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await getAvailablePort(Number.isNaN(preferredPort) ? 3000 : preferredPort);
  const httpServer = createHttpServer(app);

  // Stripe webhook needs raw body
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !db) {
      return sendApiError(
        res,
        500,
        "STRIPE_NOT_CONFIGURED",
        "Stripe webhook configuration is missing on the server.",
      );
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('Checkout session completed:', session.id);
          
          const userId = session.client_reference_id || session.metadata?.firebaseUid;
          const customerId = session.customer as string;
          
          if (userId) {
            await db.collection("users").doc(userId).set({
              stripeCustomerId: customerId,
              subscriptionTier: "premium",
              subscription: "premium",
            }, { merge: true });
            console.log(`Updated user ${userId} to premium tier with customer ID ${customerId}`);
          }
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription updated:', subscription.id);
          
          const customerId = subscription.customer as string;
          const status = subscription.status;
          
          // Find user by customer ID
          const usersRef = db.collection("users");
          const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const tier = status === "active" || status === "trialing" ? "premium" : "free";
            
            await usersRef.doc(userId).update({
              subscriptionTier: tier,
              subscription: tier,
              subscriptionStatus: status
            });
            console.log(`Updated user ${userId} subscription status to ${status} (tier: ${tier})`);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription deleted:', subscription.id);
          
          const customerId = subscription.customer as string;
          
          // Find user by customer ID
          const usersRef = db.collection("users");
          const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            await usersRef.doc(userId).update({
              subscriptionTier: "free",
              subscription: "free",
              subscriptionStatus: "canceled"
            });
            console.log(`Downgraded user ${userId} to free tier`);
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      // Still return 200 to Stripe so it doesn't retry
    }

    res.send();
  });

  // Parse JSON for other routes
  app.use(express.json());

  app.get("/api/binance/market", async (_req, res) => {
    try {
      const binanceApiKey = process.env.BINANCE_API_KEY;
      const _binanceApiSecret = process.env.BINANCE_API_SECRET;

      const endpoint =
        'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]';

      const upstreamRes = await fetch(endpoint, {
        headers: binanceApiKey ? { "X-MBX-APIKEY": binanceApiKey } : undefined,
      });

      if (!upstreamRes.ok) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 502, "BINANCE_UPSTREAM_ERROR", "Binance market endpoint failed.");
      }

      const payload = (await upstreamRes.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
      }>;

      const bySymbol = new Map(payload.map((t) => [t.symbol, t]));
      const btc = bySymbol.get("BTCUSDT");
      const eth = bySymbol.get("ETHUSDT");

      if (!btc || !eth) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 502, "BINANCE_BAD_RESPONSE", "Binance response is missing required symbols.");
      }

      const clean = {
        BTCUSDT: {
          price: Number.parseFloat(btc.lastPrice),
          change: Number.parseFloat(btc.priceChangePercent),
        },
        ETHUSDT: {
          price: Number.parseFloat(eth.lastPrice),
          change: Number.parseFloat(eth.priceChangePercent),
        },
      };

      res.setHeader("Cache-Control", "no-store");
      return res.json(clean);
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return sendStructuredError(res, 500, "MARKET_DATA_ERROR", "Unable to fetch market data.");
    }
  });

  app.get("/api/binance/klines", async (req, res) => {
    try {
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
      const interval = typeof req.query.interval === "string" ? req.query.interval : "5m";
      const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "120";
      const limit = Math.max(10, Math.min(1000, Number.parseInt(limitRaw, 10) || 120));

      const allowedSymbols = new Set(["BTCUSDT", "ETHUSDT"]);
      const allowedIntervals = new Set(["1m", "5m", "15m", "1h", "4h", "1d"]);

      if (!allowedSymbols.has(symbol) || !allowedIntervals.has(interval)) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 400, "BAD_REQUEST", "Unsupported symbol or interval.");
      }

      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
        symbol,
      )}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

      const upstreamRes = await fetch(url);
      if (!upstreamRes.ok) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 502, "BINANCE_UPSTREAM_ERROR", "Binance klines endpoint failed.");
      }

      const raw = (await upstreamRes.json()) as Array<[
        number,
        string,
        string,
        string,
        string,
        string,
        number,
        string,
        number,
        string,
        string,
        string,
      ]>;

      const candles = raw.map((k) => ({
        t: k[0],
        open: Number.parseFloat(k[1]),
        high: Number.parseFloat(k[2]),
        low: Number.parseFloat(k[3]),
        close: Number.parseFloat(k[4]),
        volume: Number.parseFloat(k[5]),
      }));

      res.setHeader("Cache-Control", "no-store");
      return res.json({ symbol, interval, candles });
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return sendStructuredError(res, 500, "KLINES_ERROR", "Unable to load candle data.");
    }
  });

  app.get("/api/binance/depth", async (req, res) => {
    try {
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
      const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "20";
      const limit = Math.max(5, Math.min(50, Number.parseInt(limitRaw, 10) || 20));

      const allowedSymbols = new Set(["BTCUSDT", "ETHUSDT"]);
      if (!allowedSymbols.has(symbol)) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 400, "BAD_REQUEST", "Unsupported depth symbol.");
      }

      const url = `https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
      const upstreamRes = await fetch(url);
      if (!upstreamRes.ok) {
        res.setHeader("Cache-Control", "no-store");
        return sendStructuredError(res, 502, "BINANCE_UPSTREAM_ERROR", "Binance depth endpoint failed.");
      }

      const raw = (await upstreamRes.json()) as {
        lastUpdateId: number;
        bids: Array<[string, string]>;
        asks: Array<[string, string]>;
      };

      const bids = raw.bids.map(([price, qty]) => ({
        price: Number.parseFloat(price),
        quantity: Number.parseFloat(qty),
      }));
      const asks = raw.asks.map(([price, qty]) => ({
        price: Number.parseFloat(price),
        quantity: Number.parseFloat(qty),
      }));

      res.setHeader("Cache-Control", "no-store");
      return res.json({ symbol, bids, asks });
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return sendStructuredError(res, 500, "DEPTH_ERROR", "Unable to load order book data.");
    }
  });

  app.get("/api/binance/trades", async (req, res) => {
    try {
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
      const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "20";
      const limit = Math.max(5, Math.min(50, Number.parseInt(limitRaw, 10) || 20));

      const allowedSymbols = new Set(["BTCUSDT", "ETHUSDT"]);
      if (!allowedSymbols.has(symbol)) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(400).json({ error: "BAD_REQUEST" });
      }

      const url = `https://api.binance.com/api/v3/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
      const upstreamRes = await fetch(url);
      if (!upstreamRes.ok) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(502).json({ error: "BINANCE_UPSTREAM_ERROR" });
      }

      const raw = (await upstreamRes.json()) as Array<{
        id: number;
        price: string;
        qty: string;
        time: number;
        isBuyerMaker: boolean;
      }>;

      const trades = raw
        .map((trade) => ({
          id: String(trade.id),
          price: Number.parseFloat(trade.price),
          quantity: Number.parseFloat(trade.qty),
          side: trade.isBuyerMaker ? "sell" : "buy",
          time: trade.time,
        }))
        .reverse();

      res.setHeader("Cache-Control", "no-store");
      return res.json({ symbol, trades });
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return res.status(500).json({ error: "TRADES_ERROR" });
    }
  });

  app.get("/api/market/overview", async (_req, res) => {
    try {
      const binanceApiKey = process.env.BINANCE_API_KEY;
      const _binanceApiSecret = process.env.BINANCE_API_SECRET;

      const [binanceRes, stooqQuotes, fxRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]', {
          headers: binanceApiKey ? { "X-MBX-APIKEY": binanceApiKey } : undefined,
        }),
        Promise.all([
          // Actions
          fetchStooqDaily("aapl.us"),
          fetchStooqDaily("msft.us"),
          fetchStooqDaily("tsla.us"),
          // ETF
          fetchStooqDaily("spy.us"),
          fetchStooqDaily("qqq.us"),
          // Matières premières
          fetchStooqDaily("xauusd"), // Gold spot (USD)
          fetchStooqDaily("cl.f"), // WTI Crude Oil Futures
        ]),
        fetch("https://open.er-api.com/v6/latest/USD"),
      ]);

      const cryptoPayload = (await binanceRes.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
      }>;

      const cryptoBySymbol = new Map(cryptoPayload.map((t) => [t.symbol, t]));
      const btc = cryptoBySymbol.get("BTCUSDT");
      const eth = cryptoBySymbol.get("ETHUSDT");

      const fxPayload = (await fxRes.json()) as {
        result: "success" | "error";
        base_code?: string;
        rates?: Record<string, number>;
      };

      const rates = fxPayload.result === "success" ? fxPayload.rates ?? {} : {};
      const usdToEur = rates["EUR"];
      const usdToJpy = rates["JPY"];
      const usdToGbp = rates["GBP"];

      const mkItem = (q: StooqDailyQuote | null, name: string) => {
        if (!q) return null;
        const change = q.open !== 0 ? ((q.close - q.open) / q.open) * 100 : 0;
        return { name, symbol: q.symbol, price: q.close, change };
      };

      const stocks = [
        mkItem(stooqQuotes[0], "Apple"),
        mkItem(stooqQuotes[1], "Microsoft"),
        mkItem(stooqQuotes[2], "Tesla"),
      ].filter(Boolean);

      const etfs = [
        mkItem(stooqQuotes[3], "SPDR S&P 500 (SPY)"),
        mkItem(stooqQuotes[4], "Invesco QQQ (QQQ)"),
      ].filter(Boolean);

      const commodities = [
        mkItem(stooqQuotes[5], "Gold (XAUUSD)"),
        mkItem(stooqQuotes[6], "WTI Crude (CL.F)"),
      ].filter(Boolean);

      const fx = [
        usdToEur ? { name: "EURUSD", symbol: "EURUSD", price: 1 / usdToEur, change: null } : null,
        usdToJpy ? { name: "USDJPY", symbol: "USDJPY", price: usdToJpy, change: null } : null,
        usdToGbp ? { name: "GBPUSD", symbol: "GBPUSD", price: 1 / usdToGbp, change: null } : null,
      ].filter(Boolean);

      const crypto = {
        BTCUSDT: btc
          ? {
              price: Number.parseFloat(btc.lastPrice),
              change: Number.parseFloat(btc.priceChangePercent),
            }
          : null,
        ETHUSDT: eth
          ? {
              price: Number.parseFloat(eth.lastPrice),
              change: Number.parseFloat(eth.priceChangePercent),
            }
          : null,
      };

      res.setHeader("Cache-Control", "no-store");
      return res.json({
        updatedAt: new Date().toISOString(),
        crypto,
        stocks,
        etfs,
        commodities,
        fx,
      });
    } catch {
      res.setHeader("Cache-Control", "no-store");
      return res.status(500).json({ error: "MARKET_OVERVIEW_ERROR" });
    }
  });

  app.post("/api/create-checkout-session", verifyFirebaseAuth, async (req: AuthedRequest, res) => {
    try {
      const { priceId } = req.body as { priceId?: string };
      const firebaseUid = req.firebaseUid;
      if (!firebaseUid) {
        return sendApiError(res, 401, "UNAUTHORIZED", "User is not authenticated.");
      }

      if (!stripe || allowedPriceIds.size === 0) {
        return sendApiError(
          res,
          500,
          "STRIPE_NOT_CONFIGURED",
          "Stripe is not configured. Check STRIPE_SECRET_KEY and price IDs in environment.",
        );
      }

      if (typeof priceId !== "string" || !allowedPriceIds.has(priceId)) {
        return sendApiError(res, 400, "INVALID_PRICE_ID", "The selected price is invalid.");
      }

      const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
      if (!origin) {
        return sendApiError(res, 400, "INVALID_ORIGIN", "Request origin header is missing.");
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cancel`,
        client_reference_id: firebaseUid,
        metadata: {
          firebaseUid,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return sendApiError(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        error?.message || "Unable to create checkout session.",
      );
    }
  });

  app.post("/api/create-portal-session", verifyFirebaseAuth, async (req, res) => {
    try {
      const { customerId } = req.body;

      if (!stripe || !db) {
        return sendApiError(
          res,
          500,
          "STRIPE_NOT_CONFIGURED",
          "Stripe is not configured on the server.",
        );
      }

      if (typeof customerId !== "string" || !customerId.trim()) {
        return sendApiError(
          res,
          400,
          "CUSTOMER_ID_REQUIRED",
          "A Stripe customer ID is required.",
        );
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      return sendApiError(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        error?.message || "Unable to create billing portal session.",
      );
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
