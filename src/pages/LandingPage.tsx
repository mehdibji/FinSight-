import React from "react";
import { Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ✅ Firebase propre
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface LandingPageProps {
  onLogin?: () => Promise<void>;
}

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const navigate = useNavigate();

  // 🔐 LOGIN GOOGLE CLEAN
  const handleLogin = async () => {
    try {
      if (onLogin) {
        await onLogin();
        navigate("/dashboard");
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      console.log("User connecté :", result.user);

      // 👉 redirection après login
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur login :", error);
      alert("Erreur lors de la connexion");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center text-center px-6">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">FinSight AI</h1>
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-bold mb-6"
      >
        Institutional edge. <br />
        <span className="text-orange-500">Retail simplicity.</span>
      </motion.h1>

      {/* Subtitle */}
      <p className="text-white/50 max-w-xl mb-10">
        The AI-powered platform to analyze, track and optimize your investments.
      </p>

      {/* CTA */}
      <button
        onClick={handleLogin}
        className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
      >
        Se connecter avec Google <ArrowRight className="w-5 h-5" />
      </button>

      {/* Secondary */}
      <button
        onClick={handleLogin}
        className="mt-4 text-white/60 hover:text-white text-sm transition"
      >
        Déjà un compte ? Se connecter
      </button>
    </div>
  );
};
