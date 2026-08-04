import React, { useState, useEffect } from "react";
import { ChevronLeft, Star, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useUserProfile } from "../hooks/useFirebaseData";
import { update, ref } from "firebase/database";
import { rtdb, auth } from "../firebase";

interface OffersScreenProps {
  onBack: () => void;
}

export const OffersScreen: React.FC<OffersScreenProps> = ({ onBack }) => {
  const profile = useUserProfile();
  const [loadingOffer, setLoadingOffer] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const coinOffers = [
    { id: 1, money: 5, coins: 10, bonus: "2x Value" },
    { id: 2, money: 10, coins: 20, bonus: "2x Value" },
    { id: 3, money: 25, coins: 50, bonus: "2x Value" },
    { id: 4, money: 50, coins: 100, bonus: "2x Value" },
  ];

  const handleBuy = async (offer: any) => {
    if (!auth.currentUser) {
      showToast("Please login first.", "error");
      return;
    }
    const currentBalance = profile?.balance || 0;
    if (currentBalance < offer.money) {
      showToast("Insufficient wallet balance. Please recharge.", "error");
      return;
    }

    setLoadingOffer(offer.id);
    try {
      const userRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        balance: currentBalance - offer.money,
        coins: (profile?.coins || 0) + offer.coins,
      });
      showToast(`Successfully purchased ${offer.coins} coins!`, "success");
    } catch (error) {
      console.error(error);
      showToast("Something went wrong.", "error");
    } finally {
      setLoadingOffer(null);
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#f5f6fa] relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border max-w-sm w-full ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="px-5 py-3 sm:py-5 shrink-0 flex items-center relative">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-7 h-7 text-[#5e35b1] stroke-[2.5]" />
        </button>
        <h1 className="text-[20px] font-bold text-[#111] mx-auto text-center">
          Coin Offers
        </h1>
        <div className="absolute right-4 flex items-center justify-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
          <span className="text-[14px] font-bold">₹{profile?.balance || 0}</span>
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col items-center w-full max-w-md mx-auto justify-evenly pb-6 mt-1">
        {/* Banner */}
        <div className="w-full bg-gradient-to-r from-[#210957] via-[#2c127a] to-[#210957] p-4 sm:p-5 rounded-[24px] shadow-lg relative overflow-hidden flex flex-row items-center shrink-0">
          {/* Background decorations */}
          <div className="absolute top-4 left-4 text-white/5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" /></svg>
          </div>
          <div className="absolute bottom-2 left-6 text-white/5">
            <Star className="w-8 h-8" />
          </div>
          <div className="absolute top-6 right-1/4 text-white/10">
            <Star className="w-6 h-6" />
          </div>

          <div className="w-[60%] relative z-10 pr-2">
            <h2 className="text-[18px] sm:text-[22px] font-bold text-white mb-2 leading-tight">
              Buy Coins for Games
            </h2>
            <p className="text-white/80 text-[11px] sm:text-[13px] leading-relaxed">
              Purchase coins using UPI or wallet balance and use them to participate in matches and tournaments!
            </p>
          </div>
          <div className="w-[40%] flex justify-end relative z-10">
            {/* Coins Illustration */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
              <div className="relative text-[65px] sm:text-[85px] leading-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] translate-x-2 -translate-y-2">🪙</div>
              <div className="absolute top-2 right-2 text-white/80 scale-75">
                <Sparkles className="w-6 h-6 fill-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0">
          <h3 className="font-bold text-[#111] text-[16px] sm:text-[17px] mb-3 flex items-center gap-1.5 px-1">
            <Star className="w-4 h-4 text-[#5e35b1] stroke-[2.5]" />
            Available Packs
            <Sparkles className="w-4 h-4 text-[#5e35b1] stroke-[2.5] translate-y-[-4px]" />
          </h3>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {coinOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white p-3 pb-3 px-3 pt-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col items-center relative hover:-translate-y-1 transition-transform"
              >
                <div className="absolute top-0 right-0 bg-[#5e35b1] text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-bl-xl rounded-tr-[20px]">
                  {offer.bonus}
                </div>
                
                <div className="text-[36px] sm:text-[40px] leading-none mb-2 drop-shadow-md">🪙</div>
                
                <span className="text-[24px] sm:text-[28px] font-black text-[#111] leading-none mb-1">
                  {offer.coins}
                </span>
                
                <p className="text-[#888] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3 sm:mb-5">
                  Coins
                </p>

                <button 
                  onClick={() => handleBuy(offer)}
                  disabled={loadingOffer === offer.id}
                  className="w-full bg-[#5e35b1] text-white py-2 sm:py-3 rounded-xl font-bold text-[14px] sm:text-[15px] hover:bg-purple-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                  {loadingOffer === offer.id ? "Processing..." : `₹${offer.money}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
