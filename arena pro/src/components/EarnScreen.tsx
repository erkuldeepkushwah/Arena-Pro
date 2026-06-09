import React, { useState } from "react";
import { ChevronLeft, Info, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { useEarnTasks, useUserProfile } from "../hooks/useFirebaseData";
import { markEarnTaskClaimed, addCoinsToWallet } from "../gameplayConfig";

interface EarnScreenProps {
  onBack: () => void;
}

export const EarnScreen: React.FC<EarnScreenProps> = ({ onBack }) => {
  const tasks = useEarnTasks();
  const profile = useUserProfile();
  
  const [processingTasks, setProcessingTasks] = useState<number[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  
  const claimedTasks = profile?.claimedEarnTasks || [];

  const handleTaskAction = (task: any) => {
    if (processingTasks.includes(task.id)) return;
    
    if (completedTasks.includes(task.id)) {
      // Claim
      if (!claimedTasks.includes(task.id)) {
        addCoinsToWallet(task.coins, profile?.coins || 0);
        markEarnTaskClaimed(task.id, claimedTasks);
      }
      return;
    }

    // Start task
    if (task.url && typeof window !== "undefined") {
      window.open(task.url, "_blank");
    }
    
    setProcessingTasks((prev) => [...prev, task.id]);
    
    // Wait 10 seconds, then complete
    setTimeout(() => {
      setProcessingTasks((prev) => prev.filter((id) => id !== task.id));
      setCompletedTasks((prev) => [...prev, task.id]);
    }, 10000);
  };

  const getTaskIcon = (iconType: string) => {
    if (iconType === "youtube") {
      return (
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-50 overflow-hidden p-1.5">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/62/YouTube_social_white_square_%282024%29.svg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original" alt="YouTube" className="w-full h-full object-contain scale-[1.1]" />
        </div>
      );
    }
    if (iconType === "instagram") {
      return (
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-50 overflow-hidden p-2">
          <img src="https://store-images.s-microsoft.com/image/apps.43327.13510798887167234.cadff69d-8229-427b-a7da-21dbaf80bd81.79b8f512-1b22-45d6-9495-881485e3a87e?h=210" alt="Instagram" className="w-full h-full object-contain scale-[1.1]" />
        </div>
      );
    }
    if (iconType === "telegram") {
      return (
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-50 overflow-hidden p-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/250px-Telegram_2019_Logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" alt="Telegram" className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-purple-50 rounded-full shadow-sm flex items-center justify-center border border-gray-50">
        <LinkIcon className="w-6 h-6 text-[#6D28D9]" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col font-sans mb-10 pb-10 relative">
      {/* Header */}
      <div className="bg-white flex items-center justify-center relative py-4 px-4 sticky top-0 z-10 border-b border-gray-100">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-gray-900 tracking-wide">
          Earn Coins
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {tasks.map((task) => {
          const isProcessing = processingTasks.includes(task.id);
          const isCompleted = completedTasks.includes(task.id);
          const isClaimed = claimedTasks.includes(task.id);

          return (
          <div
            key={task.id}
            className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3.5">
                <div className="shrink-0 mt-0.5">
                  {getTaskIcon(task.iconType)}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-bold text-[#222]">
                    {task.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-0.5 leading-snug pe-2">
                    {task.desc}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shrink-0 shadow-sm border border-yellow-500/20">
                      <span className="text-white text-[10px] font-black uppercase tracking-tighter ml-[-0.5px]">
                        $
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {task.coins}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      Coins
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleTaskAction(task)}
                disabled={isProcessing || isClaimed}
                className={`text-[13px] font-semibold px-4 pt-1.5 pb-2 rounded-lg shrink-0 mt-2 shadow-sm transition-transform ${isClaimed ? "bg-[#4B5563] text-white cursor-not-allowed" : isCompleted ? "bg-[#6D28D9] text-white active:scale-95" : "bg-white text-[#6D28D9] border border-gray-200 active:scale-95"} ${isProcessing ? "opacity-80" : ""}`}
              >
                {isClaimed ? "Claimed" : isProcessing ? "Processing..." : "Claim"}
              </button>
            </div>
          </div>
        )})}
      </div>

      {/* Info Banner at the bottom */}
      <div className="px-4 pb-6 mt-2">
        <div className="bg-[#f3f0fc] p-3.5 rounded-[12px] flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#6D28D9] flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-[#6D28D9] text-[13px] font-medium leading-tight">
            Complete tasks and earn coins. Coins can be used to get exciting
            rewards!
          </p>
        </div>
      </div>
    </div>
  );
};
