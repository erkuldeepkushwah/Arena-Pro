import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useUserProfile } from '../hooks/useFirebaseData';
import { rtdb, auth } from '../firebase';
import { ref, update } from 'firebase/database';

interface MyInvestmentsProps {
  onBack: () => void;
}

export const MyInvestments: React.FC<MyInvestmentsProps> = ({ onBack }) => {
  const profile = useUserProfile();
  const investments = profile?.investments || [];
  const [claiming, setClaiming] = useState<number | null>(null);

  const handleClaim = async (inv: any, index: number) => {
    if (!auth.currentUser) return;
    const amount = inv.unclaimedIncome || 0;
    if (amount <= 0) return;

    try {
      setClaiming(index);
      const newInvestments = [...investments];
      newInvestments[index].unclaimedIncome = 0;
      
      const userRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        balance: (profile.balance || 0) + amount,
        investments: newInvestments
      });

      alert(`Successfully claimed ₹${amount.toFixed(2)}`);
    } catch (e) {
      console.error(e);
      alert("Failed to claim daily income.");
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      <div className="bg-white px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button onClick={onBack} className="absolute left-4 p-2 -ml-2 text-[#311A89]">
          <ChevronLeft className="w-7 h-7 text-[#311A89]" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-[#14122C] tracking-wide text-center w-full">
          My Investments
        </h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {investments.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No investments found.</div>
        ) : (
          investments.map((inv: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
              <h3 className="text-[#1f2937] font-bold text-[18px] mb-1">{inv.title}</h3>
              <p className="text-gray-500 text-[14px]">
                Daily Income: <span className="text-[#16a34a] font-bold">₹{inv.dailyIncome?.toFixed(2).replace(/\.00$/, '')}</span>
              </p>
              
              <div className="mt-4 mb-5">
                <p className="text-[#1f2937] font-semibold text-[14px] mb-2 tracking-wide flex justify-between">
                  <span>Progress: {inv.progress || 0} / {inv.totalDays || 0} Days</span>
                  <span className="text-[#ea580c] font-bold">Unclaimed: ₹{(inv.unclaimedIncome || 0).toFixed(2).replace(/\.00$/, '')}</span>
                </p>
                <div className="h-2.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6D28D9] rounded-full" 
                    style={{ width: `${((inv.progress || 0) / (inv.totalDays || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {inv.unclaimedIncome > 0 ? (
                <button 
                  onClick={() => handleClaim(inv, i)}
                  disabled={claiming === i}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3.5 rounded-xl text-[15px] transition-colors"
                >
                  {claiming === i ? "Claiming..." : `Claim ₹${inv.unclaimedIncome.toFixed(2)}`}
                </button>
              ) : (
                <button disabled className="w-full bg-[#cbd5e1] text-[#64748b] font-bold py-3.5 rounded-xl text-[15px]">
                  {inv.progress >= inv.totalDays ? "Completed" : "Purchased"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
