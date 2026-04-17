import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-3xl bg-[#0A0A0A] border border-green-500/30 p-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold mb-3">Subscription successful</h1>
        <p className="text-white/60 mb-4">
          Your payment was confirmed. Your account will be upgraded to premium in a few seconds.
        </p>
        {sessionId ? (
          <p className="text-xs text-white/40 mb-8 break-all">Session: {sessionId}</p>
        ) : null}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
