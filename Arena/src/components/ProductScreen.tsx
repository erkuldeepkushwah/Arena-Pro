import React, { useState, useEffect } from 'react';
import { Coins, Star, Smile, Clock } from 'lucide-react';
import { useUserProfile, useProducts, useWelfareProducts } from '../hooks/useFirebaseData';
import { rtdb, auth } from '../firebase';
import { ref, update, get } from 'firebase/database';

const CountdownTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft === 0) return <span className="text-red-500 font-bold">EXPIRED</span>;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="font-mono text-orange-600 font-bold flex items-center gap-1">
      <Clock className="w-3.5 h-3.5" />
      {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </span>
  );
};

export const ProductScreen: React.FC = () => {
  const [activePlan, setActivePlan] = useState<'daily' | 'welfare'>('daily');
  const userProfile = useUserProfile();
  const dailyProducts = useProducts();
  const welfareProducts = useWelfareProducts();
  
  const displayProducts = activePlan === 'daily' ? dailyProducts : welfareProducts;

  const handleBuy = async (product: any) => {
    if (!auth.currentUser || !userProfile) return;
    
    if (userProfile.balance < product.price) {
      alert("Insufficient balance!");
      return;
    }

    // Determine current investments
    const currentInvestments = userProfile.investments || [];
    
    if (currentInvestments.some((inv: any) => inv.productId === product.id)) {
      alert("You already own this product!");
      return;
    }

    try {
      const userRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        balance: userProfile.balance - product.price,
        coins: (userProfile.coins || 0) + (product.price || 0),
        investments: [...currentInvestments, {
          productId: product.id,
          title: product.title,
          dailyIncome: product.validDays ? (product.totalIncome / product.validDays) : 0,
          progress: 0,
          totalDays: product.validDays,
          purchaseDate: Date.now()
        }]
      });
      alert(`Successfully purchased ${product.title}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to purchase product.");
    }
  };

  return (
    <div className="pb-28 bg-[#f8f9fa] min-h-screen">
      <div className="bg-[#a855f7] pt-10 pb-8 rounded-b-[2.5rem]">
        <div className="flex justify-between items-center px-4 mb-6">
          <div className="bg-[#ef4444] text-white px-2 py-0.5 rounded text-[11px] font-bold transform -rotate-12 outline outline-2 outline-white shadow-sm flex-shrink-0">
             NEW!
          </div>
          <h1 className="text-white text-xl font-bold translate-x-2">Products</h1>
          <div className="bg-[#8b5cf6] px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-[13px]">{userProfile?.coins || 0}</span>
          </div>
        </div>

        <div className="px-4">
          <div className="bg-[#9333ea] p-1 rounded-full flex">
            <button 
              onClick={() => setActivePlan('daily')}
              className={`flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                activePlan === 'daily' ? 'bg-[#f8f9fa] text-[#6D28D9]' : 'text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> Daily Plan
            </button>
            <button 
              onClick={() => setActivePlan('welfare')}
              className={`flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                activePlan === 'welfare' ? 'bg-[#f8f9fa] text-[#6D28D9]' : 'text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Welfare Plan
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 mt-4 space-y-3">
        {displayProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-10 mt-10">
             No products found in this category.
          </div>
        ) : (
          displayProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-[1.25rem] p-3 border border-[#6D28D9] relative shadow-sm overflow-hidden pt-8 pb-3.5">
               <div className="absolute top-0 right-0 bg-[#0ea5e9] text-white px-4 py-1 rounded-bl-[1rem] text-xs font-bold shadow-sm">
                 Days: {product.validDays}
               </div>
               
               <h3 className="text-center font-bold text-[17px] text-[#222] mb-4 relative -top-2 tracking-wide flex justify-center items-center gap-2">
                 {product.title}
                 {product.endTime && <CountdownTimer endTime={product.endTime} />}
               </h3>
             
             <div className="flex gap-2.5 items-center">
                <div className="w-[84px] h-[84px] sm:w-[100px] sm:h-[100px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center -mt-3">
                  <img src={product.thumbnail} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center mb-4 sm:mb-6">
                    <div>
                      <p className="text-[#a855f7] font-bold text-[16px] sm:text-[19px] leading-none mb-1">₹{(product.totalIncome / product.validDays).toFixed(2).replace(/\.00$/, '')}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase text-[#111]">Daily</p>
                    </div>
                    <div>
                      <p className="text-[#a855f7] font-bold text-[16px] sm:text-[19px] leading-none mb-1">₹{product.totalIncome}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase text-[#111]">Total</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-[1px] sm:gap-0.5 mb-1 h-[16px] sm:h-[19px]">
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                        <p className="text-gray-800 font-bold text-[16px] sm:text-[19px] leading-none">{product.price}</p>
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase text-[#111]">Coins</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-orange-500 font-bold text-[16px] sm:text-[20px] leading-none">Price: ₹{product.price}</p>
                    {userProfile?.investments?.some((inv: any) => inv.productId === product.id) || product.isOwned ? (
                      <button className="bg-[#cbd5e1] text-gray-500 font-bold py-1.5 px-4 sm:py-2.5 sm:px-7 rounded-full text-xs sm:text-sm">
                        Owned
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuy(product)}
                        className="bg-[#3b82f6] text-white font-bold py-1.5 px-4 sm:py-2.5 sm:px-7 rounded-full text-xs sm:text-sm"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
             </div>
          </div>
        )))}
      </div>
    </div>
  );
};
