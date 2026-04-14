import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletTracker } from './components/dashboard/WalletTracker';
import { SmartAlerts } from './components/dashboard/SmartAlerts';
import { ChatInterface } from './components/ai/ChatInterface';
import { MarketOverview } from './components/dashboard/MarketOverview';
import { PricingPage } from './pages/PricingPage';
import { useStore, Asset, Alert } from './store/useStore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Mock pages for other routes
const BlogPage = () => <div className="p-8 text-center text-white/40">Education Page (Coming Soon)</div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { user, setUser, setAssets, setAlerts } = useStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Investor',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL,
        });

        // Ensure user document exists for subscription tracking
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: firebaseUser.email,
              subscriptionTier: 'free',
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error("Error creating user document:", error);
        }

      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setAssets([]);
      setAlerts([]);
      return;
    }

    const assetsQuery = query(collection(db, 'assets'), where('userId', '==', user.uid));
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
      setAssets(assetsData);
    }, (error) => {
      console.error('Error fetching assets:', error);
    });

    const alertsQuery = query(collection(db, 'alerts'), where('userId', '==', user.uid));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(alertsData);
    }, (error) => {
      console.error('Error fetching alerts:', error);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeAlerts();
    };
  }, [user, isAuthReady, setAssets, setAlerts]);

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
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="wallet" element={<WalletTracker />} />
            <Route path="markets" element={<MarketOverview />} />
            <Route path="copilot" element={<div className="h-[calc(100vh-12rem)]"><ChatInterface /></div>} />
            <Route path="alerts" element={<SmartAlerts />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="education" element={<BlogPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
