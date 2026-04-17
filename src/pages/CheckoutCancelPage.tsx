import React from 'react';
import { CircleX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-3xl bg-[#0A0A0A] border border-white/10 p-10 text-center">
        <CircleX className="w-14 h-14 text-white/50 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold mb-3">Checkout canceled</h1>
        <p className="text-white/60 mb-8">
          No worries. You can restart your subscription whenever you are ready.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </button>
      </div>
    </div>
  );
};
