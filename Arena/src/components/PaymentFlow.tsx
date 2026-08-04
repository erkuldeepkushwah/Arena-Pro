import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

import { useUserProfile } from '../hooks/useFirebaseData';
import { rtdb, auth } from '../firebase';
import { ref, push, update, serverTimestamp } from 'firebase/database';

interface PaymentFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'amount' | 'qr'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [utr, setUtr] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(297);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userProfile = useUserProfile(); 

  useEffect(() => {
    if (step === 'qr' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const handleComplete = async () => {
    if (!utr.trim()) {
      alert("Please enter UTR / Transaction ID");
      return;
    }
    const rechargeAmount = Number(amount);
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      
      const requestRef = push(ref(rtdb, 'rechargeRequests'));
      const timestamp = serverTimestamp();
      
      await update(requestRef, {
        uid: uid,
        userId: uid,
        amount: rechargeAmount,
        utr: utr.trim(),
        status: 'pending',
        timestamp: timestamp
      });
      
      alert("Recharge request submitted successfully! Pending admin approval.");
      onComplete();
    } catch(err) {
      alert("Failed to submit request: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-10">
      <div className="bg-[#f9fafb] px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button onClick={step === 'qr' ? () => setStep('amount') : onBack} className="absolute left-4 p-2 -ml-2 text-white">
          <ChevronLeft className="w-6 h-6 text-gray-300" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-[#f0f0f0] tracking-wide text-center w-full" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {step === 'amount' ? 'Recharge' : 'Complete Payment'}
        </h1>
      </div>

      <div className="px-5 mt-6">
        {step === 'amount' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 text-center">
              <p className="text-gray-500 font-medium text-sm mb-1.5">Current Balance</p>
              <p className="text-[#6D28D9] font-bold text-4xl">₹{userProfile?.balance || 0}</p>
            </div>

            <div className="space-y-2 mt-8">
              <label className="text-[#333] font-bold text-[15px]">Enter Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Recharge Amount"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] text-gray-800 text-base shadow-sm"
              />
            </div>

            <button 
              onClick={() => amount && setStep('qr')}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all mt-4 ${amount ? 'bg-[#6D28D9] shadow-md' : 'bg-[#a78bfa]'}`}
              disabled={!amount}
            >
              Proceed to Pay
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="text-center mt-2 mb-2">
              <p className="text-gray-500 font-medium text-[15px]">Payment Amount</p>
              <p className="text-[#6D28D9] font-bold text-[56px] leading-[1.1]">₹{amount}</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col items-center mb-6">
              <h3 className="text-[#111] font-bold text-[17px] mb-8">Scan QR Code to Pay</h3>
              
              <div className="mb-8 flex justify-center">
                <img 
                  src="https://uploads.onecompiler.io/43b6sbecd/43xs3kr43/1000048804.png" 
                  alt="Payment QR" 
                  className="w-[200px] h-[200px] object-contain border border-gray-100 rounded-xl"
                />
              </div>

              <div className="text-[#dc2626] font-bold text-[28px] tracking-[0.05em]">
                {formatTime(timeLeft)}
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Enter UTR / Transaction ID"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-center text-gray-400 font-medium focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] shadow-sm mb-4"
            />
            
            <button 
              onClick={handleComplete}
              disabled={isSubmitting}
              className={`w-full text-white font-bold py-3.5 rounded-xl text-[15px] ${isSubmitting ? 'bg-[#a78bfa]' : 'bg-[#6D28D9]'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button 
              onClick={() => setStep('amount')}
              className="w-full bg-[#e5e7eb] text-[#333] font-medium py-3.5 rounded-xl mt-3 text-[15px]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
