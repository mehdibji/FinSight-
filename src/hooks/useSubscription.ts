import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: () => void;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Listen to the user's document in Firestore for their subscription status
        const userRef = doc(db, 'users', user.uid);
        
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Fallback to 'free' if not set
            setTier((data.subscriptionTier as SubscriptionTier) || 'free');
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
        if (unsubscribeDoc) {
          unsubscribeDoc();
        }
        setTier('free');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  return {
    tier,
    loading,
    isPro: tier === 'pro' || tier === 'premium',
    isPremium: tier === 'premium',
  };
};
