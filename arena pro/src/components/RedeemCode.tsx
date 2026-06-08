import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface RedeemCodeProps {
  onBack: () => void;
}

export const RedeemCode: React.FC<RedeemCodeProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <div className="bg-[#f8f9fa] px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button onClick={onBack} className="absolute left-4 p-2 -ml-2 text-white">
          <ChevronLeft className="w-6 h-6 text-gray-300" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-[#f0f0f0] tracking-wide text-center w-full" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          Redeem Code
        </h1>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
          <h2 className="text-[#374151] font-bold text-[16px] mb-4">Enter Redeem Code</h2>
          <input 
            type="text"
            placeholder="ENTER CODE HERE"
            className="w-full bg-[#f8f9fa] border border-gray-100 rounded-xl py-3.5 px-4 text-center text-gray-500 font-medium tracking-wide focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] mb-4"
          />
          <button className="w-full bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl shadow-sm text-[16px]">
            Get Balance
          </button>
        </div>
      </div>
    </div>
  );
};
