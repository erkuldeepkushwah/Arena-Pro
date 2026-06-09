import React from 'react';
import { Copy, ChevronLeft } from 'lucide-react';
import { MOCK_REFERRALS } from '@/src/constants';
import { useUserProfile } from '../hooks/useFirebaseData';
import { auth } from '../firebase';

interface PromotionScreenProps {
  onBack: () => void;
}

export const PromotionScreen: React.FC<PromotionScreenProps> = ({ onBack }) => {
  const userProfile = useUserProfile();

  return (
    <div className="pb-28 bg-[#f8f9fa] min-h-screen">
      <div className="bg-white px-5 py-5 mb-5 shadow-sm border-b border-gray-100 flex items-center h-16 relative">
        <button onClick={onBack} className="absolute left-4 p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-[19px] font-bold text-[#111] mx-auto flex-1 text-center pr-8">Invite & Earn</h1>
      </div>

      <div className="px-5 space-y-5">
        <div className="bg-white rounded-[1.25rem] p-7 border border-[#a855f7] text-center shadow-sm">
           <p className="text-gray-500 font-medium text-[15px] mb-5">Your Referral Code</p>
           <div className="border border-dashed border-[#a855f7] bg-[#fdfcff] py-3.5 px-8 rounded-xl inline-block mb-3 w-4/5 border-[1.5px]">
             <span className="text-[#6D28D9] font-medium text-[27px] tracking-[0.1em]">{userProfile?.referralCode || auth.currentUser?.uid?.slice(0, 8).toUpperCase() || "N/A"}</span>
           </div>

           <button 
              className="flex items-center justify-center gap-2 text-[#6D28D9] font-bold text-[15px] mx-auto mt-2 mb-1"
              onClick={() => {
                const code = userProfile?.referralCode || auth.currentUser?.uid?.slice(0, 8).toUpperCase() || "N/A";
                navigator.clipboard.writeText(code);
                alert("Referral Code copied!");
              }}
           >
             <Copy className="w-4 h-4" strokeWidth={2.5} /> Tap to copy
           </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-sm">
          {MOCK_REFERRALS.map((task) => (
            <div key={task.id} className="p-5">
               <div className="flex justify-between items-center mb-5">
                 <p className="font-bold text-[#111] text-[15px]">
                   Invite {task.friendsCount} friends <span className="text-[#22c55e] font-bold ml-1">+₹{task.reward}</span>
                 </p>
                 <button className="bg-[#f3f4f6] text-[#9ca3af] font-bold px-5 py-2 rounded-lg text-[13px]">
                   Claim
                 </button>
               </div>
               <div className="flex justify-between text-[11px] text-[#9ca3af] mb-2 font-medium">
                 <span>Progress:</span>
                 <span>0 / {task.friendsCount}</span>
               </div>
               <div className="h-[7px] bg-[#f3f4f6] rounded-full overflow-hidden">
                 <div className="h-full bg-[#22c55e] w-1" />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
