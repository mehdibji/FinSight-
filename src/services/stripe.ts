import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const createCheckoutSession = async (priceId: string) => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('You must be logged in to subscribe.');
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId: user.uid,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.url) {
    window.location.href = data.url;
  }
  
  return data;
};

export const createPortalSession = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('You must be logged in to manage your subscription.');
  }

  // Fetch the stripeCustomerId from the user's Firestore document
  let customerId = 'mock_customer_id'; 
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.stripeCustomerId) {
        customerId = data.stripeCustomerId;
      }
    }
  } catch (error) {
    console.error("Error fetching user document:", error);
  }

  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.url) {
    window.location.href = data.url;
  }
  
  return data;
};
