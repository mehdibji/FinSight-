import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-03-25.dahlia',
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe webhook needs raw body
  app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;

    try {
      if (process.env.STRIPE_SECRET_KEY) {
        event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
      } else {
        // Mock mode
        event = JSON.parse(req.body.toString());
      }
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
          
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          
          if (userId) {
            await db.collection('users').doc(userId).set({
              stripeCustomerId: customerId,
              subscriptionTier: 'pro', // Assuming 'pro' for now, could be dynamic based on priceId
            }, { merge: true });
            console.log(`Updated user ${userId} to pro tier with customer ID ${customerId}`);
          }
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription updated:', subscription.id);
          
          const customerId = subscription.customer as string;
          const status = subscription.status;
          
          // Find user by customer ID
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const tier = status === 'active' || status === 'trialing' ? 'pro' : 'free';
            
            await usersRef.doc(userId).update({
              subscriptionTier: tier,
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
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            await usersRef.doc(userId).update({
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled'
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

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { priceId, userId } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        // Mock mode
        console.log(`Mock creating checkout session for user ${userId} with price ${priceId}`);
        // In mock mode, we'll just update the user directly since there's no webhook
        if (userId) {
          try {
            await db.collection('users').doc(userId).set({
              subscriptionTier: 'pro',
              stripeCustomerId: 'mock_customer_' + userId
            }, { merge: true });
          } catch (e) {
            console.error("Mock DB update failed", e);
          }
        }
        return res.json({ url: '/dashboard' });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/pricing`,
        client_reference_id: userId,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-portal-session', async (req, res) => {
    try {
      const { customerId } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        // Mock mode
        console.log(`Mock creating portal session for customer ${customerId}`);
        return res.json({ url: '/dashboard' });
      }

      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID required' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
