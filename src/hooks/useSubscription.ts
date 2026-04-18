import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'premium';

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Listen to the user's document in Firestore for their subscription status
        const userRef = doc(db, 'users', user.uid);
        
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const subscription = data.subscription as SubscriptionTier | undefined;
            const subscriptionTier = data.subscriptionTier as SubscriptionTier | undefined;
            setTier(subscription || subscriptionTier || 'free');
          } else {
            setTier('free');
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
    loading,
    isPro: tier === 'premium',
    isPremium: tier === 'premium',
  };
};
