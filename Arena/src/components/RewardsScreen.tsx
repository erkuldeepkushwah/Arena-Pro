import React from "react";
import { useAllUsers } from "../hooks/useFirebaseData";

export const RewardsScreen: React.FC = () => {
  const allUsers = useAllUsers();
  
  // Sort users by coins
  const topUsers = [...allUsers]
    .filter(u => (u.coins || 0) > 0)
    .sort((a, b) => (b.coins || 0) - (a.coins || 0))
    .slice(0, 50);

  return (
    <div className="pb-28 bg-[#f8f9fe] min-h-screen font-sans">
      <div className="bg-white px-5 py-5 mb-5 shadow-sm border-b border-gray-100 flex items-center justify-between h-16">
        <h1 className="text-[19px] font-bold text-[#111]">Leaderboard</h1>
      </div>

      <div className="px-5">
        <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
          Top Earners
        </h2>
        
        {topUsers.length > 0 ? (
          <div className="bg-white rounded-3xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
            {topUsers.map((user, idx) => {
              const name = user.displayName || user.bankDetails?.mobileNumber || user.email?.split("@")[0] || `Player ${user.uid.slice(0,5)}`;
              const cup = idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
              
              return (
                <div
                  key={user.uid}
                  className="flex justify-between items-center py-3 px-2 sm:py-4 sm:px-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    {cup ? (
                      <span className="text-2xl sm:text-3xl drop-shadow-md min-w-[30px] sm:min-w-[36px] text-center shrink-0">
                        {cup}
                      </span>
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-gray-400 min-w-[30px] sm:min-w-[36px] text-center shrink-0">
                        #{idx + 1}
                      </span>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-100 to-blue-50 flex items-center justify-center text-lg sm:text-xl overflow-hidden border border-gray-100 shrink-0">
                        👨🏻
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-[#374151] text-[13px] sm:text-[15px] truncate max-w-[100px] sm:max-w-none">
                          {name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-1">
                    <div className="text-yellow-600 font-extrabold text-[13px] sm:text-[16px] flex items-center gap-1">
                      {Math.floor(user.coins || 0)}
                      <span className="text-[10px] sm:text-xs text-yellow-500">Coins</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="text-center py-10 text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
             <div className="text-4xl mb-3">🏆</div>
             <p className="font-bold text-gray-700">No players yet</p>
             <p className="text-xs mt-1">Play tournaments and earn coins to rank up!</p>
           </div>
        )}
      </div>
    </div>
  );
};
