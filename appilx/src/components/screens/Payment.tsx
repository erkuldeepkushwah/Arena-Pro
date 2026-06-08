import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QrCode, Timer, ShieldCheck, Copy, CheckCircle2, ChevronLeft } from 'lucide-react';
import { ScreenType } from '../../types';

interface PaymentProps {
  step: 'AMOUNT' | 'COMPLETE';
  setScreen: (screen: ScreenType) => void;
  setPaymentStep: (step: 'AMOUNT' | 'COMPLETE') => void;
}

export const PaymentScreen: React.FC<PaymentProps> = ({ step, setScreen, setPaymentStep }) => {
  const [amount, setAmount] = useState('500');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (step === 'COMPLETE' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'AMOUNT') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-12">
        <button onClick={() => setScreen('HOME')} className="mb-8 flex items-center text-gray-400 font-medium space-x-1">
          <ChevronLeft size={20} />
          <span>Back to Home</span>
        </button>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Recharge Account</h1>
        <p className="text-gray-400 text-sm font-medium mb-12">Select or enter the amount you want to recharge</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {['500', '1500', '3000', '5000', '10000', '20000'].map((val) => (
            <button 
              key={val}
              onClick={() => setAmount(val)}
              className={`h-12 rounded-2xl font-black text-sm transition-all border ${
                amount === val 
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' 
                : 'bg-white text-gray-500 border-gray-100 active:border-purple-200'
              }`}
            >
              ₹{val}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-12">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">Custom Amount</p>
          <div className="flex items-center space-x-2 border-b-2 border-gray-50 pb-2 focus-within:border-purple-600 transition-colors">
            <span className="text-2xl font-black text-purple-600">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-2xl font-black focus:outline-none bg-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <button 
          onClick={() => setPaymentStep('COMPLETE')}
          className="w-full h-16 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-100 active:scale-[0.98] transition-transform"
        >
          Proceed to Pay ₹{amount}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-12 flex flex-col items-center">
      <div className="bg-white rounded-[40px] w-full p-8 shadow-xl border border-gray-50 text-center flex flex-col items-center">
        <div className="bg-orange-50 text-orange-500 px-4 py-2 rounded-full flex items-center space-x-2 mb-8">
          <Timer size={16} />
          <span className="font-black text-xs tabular-nums">{formatTime(timeLeft)} remaining</span>
        </div>

        <div className="relative w-48 h-48 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 border-4 border-purple-50 p-4">
          <QrCode size={140} className="text-purple-600" />
          <div className="absolute inset-x-0 -bottom-4 translate-y-1/2 flex justify-center">
            <div className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-900 mt-4 mb-2">Scan & Pay</h2>
        <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed max-w-[200px] mx-auto">
          Scan the QR code above using any UPI App to pay <span className="text-purple-600 font-black italic">₹{amount}</span>
        </p>

        <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between mb-12">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">UPI ID</p>
            <p className="font-bold text-gray-800">applix.pay@upi</p>
          </div>
          <button className="text-purple-600 font-black text-sm flex items-center space-x-1">
            <Copy size={16} />
            <span>Copy</span>
          </button>
        </div>

        <div className="w-full space-y-4">
          <div className="text-left">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1 mb-2 block">
              Enter 12-Digit UTR / Transaction ID
            </label>
            <input 
              type="text" 
              placeholder="e.g. 408272635412"
              className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 font-bold transition-all"
            />
          </div>
          <button 
            onClick={() => setScreen('HOME')}
            className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform"
          >
            <CheckCircle2 size={18} />
            <span>Submit Payment</span>
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
        <ShieldCheck size={14} />
        <span>Secure Encrypted Payment System</span>
      </p>
    </div>
  );
};
