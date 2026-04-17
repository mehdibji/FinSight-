import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

type StripeApiResponse = {
  url?: string;
  error?: string;
  message?: string;
};

const parseApiResponse = async (response: Response): Promise<StripeApiResponse> => {
  try {
    const json = (await response.json()) as StripeApiResponse;
    return json;
  } catch {
    return {};
  }
};

const resolveApiErrorMessage = (payload: StripeApiResponse, fallback: string): string => {
  const detailed = payload.message || payload.error;
  if (detailed === 'FIREBASE_ADMIN_MISCONFIGURED') {
    return 'Server Firebase configuration is missing. Please contact support.';
  }
  if (detailed === 'STRIPE_NOT_CONFIGURED') {
    return 'Stripe configuration is missing on the server.';
  }
  if (detailed === 'UNAUTHORIZED') {
    return 'Your session is invalid. Please sign out and sign in again.';
  }
  return detailed || fallback;
};

export const createCheckoutSession = async (priceId: string) => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('You must be logged in to subscribe.');
  }

  const idToken = await user.getIdToken();

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      priceId,
    }),
  });

  const data = await parseApiResponse(response);

  if (!response.ok || data.error) {
    throw new Error(resolveApiErrorMessage(data, 'Failed to start checkout.'));
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
  const idToken = await user.getIdToken();

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
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      customerId,
    }),
  });

  const data = await parseApiResponse(response);

  if (!response.ok || data.error) {
    throw new Error(resolveApiErrorMessage(data, 'Failed to open billing portal.'));
  }

  if (data.url) {
    window.location.href = data.url;
  }
  
  return data;
};
