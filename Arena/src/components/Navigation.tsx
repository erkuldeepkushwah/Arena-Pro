import React from "react";
import { Home, Package, Gift, Gamepad2, User, Trophy } from "lucide-react";

type Tab = "home" | "product" | "play" | "profile" | "rewards";

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#f8f9fe] border-t border-gray-100 px-4 pt-3 pb-6 flex justify-between items-end z-50">
      <button
        onClick={() => setActiveTab("home")}
        className="flex flex-col items-center gap-1 w-14"
      >
        <Home
          className={`w-6 h-6 ${activeTab === "home" ? "text-[#6D28D9]" : "text-gray-500"}`}
          strokeWidth={activeTab === "home" ? 2.5 : 2}
        />
        <span
          className={`text-[10px] mb-0.5 font-medium ${activeTab === "home" ? "text-[#6D28D9]" : "text-gray-500"}`}
        >
          Home
        </span>
      </button>

      <button
        onClick={() => setActiveTab("product")}
        className="flex flex-col items-center gap-1 w-14"
      >
        <Package
          className={`w-6 h-6 ${activeTab === "product" ? "text-[#6D28D9]" : "text-gray-500"}`}
          strokeWidth={activeTab === "product" ? 2.5 : 2}
        />
        <span
          className={`text-[10px] mb-0.5 font-medium ${activeTab === "product" ? "text-[#6D28D9]" : "text-gray-500"}`}
        >
          Product
        </span>
      </button>

      <button
        onClick={() => setActiveTab("rewards")}
        className="flex flex-col items-center gap-[2px] w-14"
      >
        <div className="w-[38px] h-[38px] bg-[#6D28D9] rounded-full flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <span
          className={`text-[10px] font-medium ${activeTab === "rewards" ? "text-[#6D28D9]" : "text-gray-500"}`}
        >
          Rankings
        </span>
      </button>

      <button
        onClick={() => setActiveTab("play")}
        className="flex flex-col items-center gap-1 w-14"
      >
        <img
          src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/console.png"
          alt="Play"
          className={`w-6 h-6 object-contain ${activeTab === "play" ? "" : "grayscale opacity-60"}`}
        />
        <span
          className={`text-[10px] mb-0.5 font-medium ${activeTab === "play" ? "text-[#6D28D9]" : "text-gray-500"}`}
        >
          Play
        </span>
      </button>

      <button
        onClick={() => setActiveTab("profile")}
        className="flex flex-col items-center gap-1 w-14"
      >
        <User
          className={`w-6 h-6 ${activeTab === "profile" ? "text-[#6D28D9]" : "text-gray-500"}`}
          strokeWidth={activeTab === "profile" ? 2.5 : 2}
        />
        <span
          className={`text-[10px] mb-0.5 font-medium ${activeTab === "profile" ? "text-[#6D28D9]" : "text-gray-500"}`}
        >
          Profile
        </span>
      </button>
    </div>
  );
};
