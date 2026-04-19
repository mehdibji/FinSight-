import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'premium';

function resolveTier(data: Record<string, unknown>): SubscriptionTier {
  const plan = typeof data.plan === 'string' ? data.plan : '';
  if (plan === 'pro') return 'premium';

  const subscriptionTier = data.subscriptionTier;
  if (subscriptionTier === 'premium' || subscriptionTier === 'free') {
    return subscriptionTier;
  }

  const subscription = data.subscription;
  if (subscription === 'premium' || subscription === 'free') {
    return subscription;
  }

  if (subscription && typeof subscription === 'object' && 'status' in subscription) {
    const status = (subscription as { status?: string }).status;
    if (status === 'active' || status === 'trialing') return 'premium';
  }

  return 'free';
}

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [planId, setPlanId] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Listen to the user's document in Firestore for their subscription status
        const userRef = doc(db, 'users', user.uid);
        
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Record<string, unknown>;
            setPlanId(typeof data.plan === 'string' ? data.plan : 'free');
            setTier(resolveTier(data));
          } else {
            setTier('free');
            setPlanId('free');
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching subscription status:", error);
          setTier('free');
          setLoading(false);
        });
      } else {
        unsubscribeDoc?.();
        unsubscribeDoc = null;
        setTier('free');
        setPlanId('free');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc?.();
    };
  }, []);

  return {
    tier,
    plan: planId,
    loading,
    isPro: planId === 'pro' || tier === 'premium',
    isPremium: planId === 'pro' || tier === 'premium',
  };
};
