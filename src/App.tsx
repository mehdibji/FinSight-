import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletTracker } from './components/dashboard/WalletTracker';
import { SmartAlerts } from './components/dashboard/SmartAlerts';
import { ChatInterface } from './components/ai/ChatInterface';
import { MarketOverview } from './components/dashboard/MarketOverview';
import { AssetPage } from './pages/AssetPage';
import { PricingPage } from './pages/PricingPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { CheckoutCancelPage } from './pages/CheckoutCancelPage';
import { useStore, Asset, Alert } from './store/useStore';
import { useSubscription } from './hooks/useSubscription';

// ✅ Firebase propre
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

// Mock page
const BlogPage = () => (
  <div className="p-8 text-center text-white/40">
    Education Page (Coming Soon)
  </div>
);

// 🔐 Protection route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const PremiumRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useStore();
  const { tier, loading } = useSubscription();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (loading) {
    return (
      <div className="min-h-[300px] bg-[#050505] flex items-center justify-center rounded-2xl border border-white/10">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (tier !== 'premium') {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { user, setUser, setAssets, setAlerts } = useStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 🔥 LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User connecté :", result.user);
    } catch (error) {
      console.error("Erreur login :", error);
    }
  };

  // 🔐 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Investor',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL,
        });

        // créer user Firestore si absent
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: firebaseUser.email,
              subscriptionTier: 'free',
              subscription: 'free',
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error("Erreur Firestore:", error);
        }

      } else {
        setUser(null);
      }

      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser]);

  // 📊 Data temps réel
  useEffect(() => {
    if (!user || !isAuthReady) {
      setAssets([]);
      setAlerts([]);
      return;
    }

    const assetsQuery = query(
      collection(db, 'assets'),
      where('userId', '==', user.uid)
    );

    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Asset));

      setAssets(assetsData);
    });

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('userId', '==', user.uid)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Alert));

      setAlerts(alertsData);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeAlerts();
    };
  }, [user, isAuthReady, setAssets, setAlerts]);

  // ⏳ loader
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="font-sans">
        <Routes>

          {/* Landing */}
          <Route 
            path="/" 
            element={
              user 
                ? <Navigate to="/dashboard" replace /> 
                : <LandingPage onLogin={handleGoogleLogin} />
            } 
          />

          {/* Protected */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="wallet" element={<WalletTracker />} />
            <Route path="markets" element={<MarketOverview />} />
            <Route path="asset/:id" element={<AssetPage />} />
            <Route path="copilot" element={<PremiumRoute><ChatInterface /></PremiumRoute>} />
            <Route path="alerts" element={<SmartAlerts />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="education" element={<BlogPage />} />
            <Route path="success" element={<CheckoutSuccessPage />} />
            <Route path="cancel" element={<CheckoutCancelPage />} />
          </Route>

        </Routes>
      </div>
    </BrowserRouter>
  );
}
