import React, { useEffect, useState } from 'react';
import { ChevronLeft, Users, Gift, Coins } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { rtdb, auth } from '../firebase';
import { useUserProfile } from '../hooks/useFirebaseData';

interface SalesRecordProps {
  onBack: () => void;
}

export const SalesRecord: React.FC<SalesRecordProps> = ({ onBack }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // We identify the user's reference code (referral code). 
  // Let's assume user.uid is their referral code or they have a 'referralCode' field.
  const profile = useUserProfile();

  useEffect(() => {
    const fetchSales = async () => {
      if (!auth.currentUser) return;
      const myId = auth.currentUser.uid;
      const shortCode = myId.slice(0, 8).toUpperCase();
      const myRefCode = profile?.referralCode || shortCode;

      try {
        const usersRef = ref(rtdb, 'users');
        const snap = await get(usersRef);
        if (snap.exists()) {
          const allUsers = snap.val();
          const referredUsers = Object.entries(allUsers)
            .map(([uid, data]: [string, any]) => ({ uid, ...data }))
            .filter((u) => typeof u.referredBy === 'string' && (
               u.referredBy === myRefCode || 
               u.referredBy === myId || 
               u.referredBy === shortCode ||
               u.referredBy.toLowerCase() === shortCode.toLowerCase()
            ));
          setSales(referredUsers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [profile]);

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="bg-white pt-10 pb-4 flex flex-col items-center relative text-center">
        <button onClick={onBack} className="absolute left-4 top-10 p-2 -ml-2 text-[#311A89]">
          <ChevronLeft className="w-7 h-7 text-[#311A89]" strokeWidth={2.5} />
        </button>
        <h1 className="text-[22px] font-bold text-[#14122C] tracking-tight text-center w-full">
          Sales
        </h1>
      </div>

      <div className="px-4 mt-2 space-y-4">
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-[#350A86] via-[#24065D] to-[#150337] rounded-3xl flex items-center shadow-xl relative overflow-hidden h-[190px] border border-purple-900/40">
          
          {/* Subtle Background Decorations */}
          <div className="absolute top-4 left-4 opacity-5 pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"></path><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>
          </div>
          <div className="absolute bottom-3 left-10 opacity-5 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div className="absolute top-8 right-[45%] opacity-10 pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
          </div>

          <div className="absolute top-[25%] right-[25%] pointer-events-none">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#E9D5FF] drop-shadow-[0_0_8px_rgba(233,213,255,0.8)]"><path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5Z" /></svg>
          </div>

          {/* Text Content */}
          <div className="relative z-10 pl-5 w-[65%]">
            <div className="bg-[#180644]/70 backdrop-blur-sm w-fit px-3 py-[5px] mb-3 rounded-sm text-white/95 font-medium text-[15px]">
              Earn Lifetime 5% Coins
            </div>
            <p className="text-white/70 text-[11px] leading-[1.4] pr-2">
              Purchase coins using UPI or wallet balance and use them to participate in matches and tournaments!
            </p>
          </div>

          {/* Right Image */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-[180px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] z-0 transform hover:scale-105 transition-transform duration-500">
             <img 
               src="https://cdn3d.iconscout.com/3d/premium/thumb/stack-of-gold-coins-6421319-5309657.png" 
               alt="Coins" 
               className="w-full object-contain drop-shadow-2xl"
               onError={(e) => {
                 (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/5501/5501360.png";
               }}
             />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : sales.length > 0 ? (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-full">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Referred</p>
                  <p className="text-lg font-bold text-gray-800">{sales.length} Members</p>
                </div>
              </div>
            </div>
            {sales.map((user, idx) => {
              const userCoins = user.coins || 0;
              const bonus = Math.floor(userCoins * 0.05);

              return (
                <div key={user.uid || idx} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-gray-200 rounded-full flex justify-center items-center font-bold text-gray-500 bg-gray-50">
                       {user.displayName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-[#1f2937] font-bold text-sm mb-0.5 leading-tight">{user.displayName || user.bankDetails?.mobileNumber || user.email || 'Unknown User'}</p>
                      <p className="text-gray-400 text-xs">Joined via your code</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                      <Gift className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-bold text-green-700">5% Bonus: {bonus}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
           <div className="text-center py-10 text-gray-500">
             <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             No sales yet. Share your code!
           </div>
        )}
      </div>
    </div>
  );
};
