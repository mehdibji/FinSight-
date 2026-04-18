import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useStore, Asset, Alert } from './store/useStore';

// ✅ Firebase propre
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const WalletTracker = lazy(() => import('./components/dashboard/WalletTracker').then((m) => ({ default: m.WalletTracker })));
const SmartAlerts = lazy(() => import('./components/dashboard/SmartAlerts').then((m) => ({ default: m.SmartAlerts })));
const ChatInterface = lazy(() => import('./components/ai/ChatInterface').then((m) => ({ default: m.ChatInterface })));
const MarketOverview = lazy(() => import('./components/dashboard/MarketOverview').then((m) => ({ default: m.MarketOverview })));
const AssetPage = lazy(() => import('./pages/AssetPage').then((m) => ({ default: m.AssetPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage').then((m) => ({ default: m.CheckoutSuccessPage })));
const CheckoutCancelPage = lazy(() => import('./pages/CheckoutCancelPage').then((m) => ({ default: m.CheckoutCancelPage })));

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

const RouteSkeleton = () => (
  <div className="min-h-[60vh] animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
    <div className="mb-4 h-7 w-52 rounded bg-white/10" />
    <div className="mb-3 h-4 w-80 max-w-full rounded bg-white/10" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="h-36 rounded-2xl bg-white/10" />
      <div className="h-36 rounded-2xl bg-white/10" />
    </div>
  </div>
);

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
        <Suspense fallback={<RouteSkeleton />}>
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
              <Route path="copilot" element={<ChatInterface />} />
              <Route path="alerts" element={<SmartAlerts />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="education" element={<BlogPage />} />
              <Route path="success" element={<CheckoutSuccessPage />} />
              <Route path="cancel" element={<CheckoutCancelPage />} />
            </Route>

            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
