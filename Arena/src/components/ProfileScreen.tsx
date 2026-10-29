import React, { useRef, useState, useEffect } from "react";
import {
  LogOut,
  ChevronRight,
  Wallet,
  History,
  Tag,
  CreditCard,
  PieChart,
  Gift,
  Users,
  Receipt,
} from "lucide-react";
import { useUserProfile, useSiteConfig } from "../hooks/useFirebaseData";
import coinIcon from "../assets/coin.png";
import { fileToAvatarDataUrl, saveAvatar } from "../utils/avatar";

interface ProfileScreenProps {
  onLogout: () => void;
  onNavigate?: (path: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onNavigate,
}) => {
  const userProfile = useUserProfile();
  const coins = userProfile?.coins || 0;
  const siteCfg = useSiteConfig();
  const coinSrc = siteCfg?.coinIcon || coinIcon;

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatarUploading(true);
      const dataUrl = await fileToAvatarDataUrl(file);
      await saveAvatar(dataUrl);
    } catch (err: any) {
      alert(err?.message || "Could not update your photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const menuItems = [
    {
      icon: Wallet,
      label: "Add Balance",
      color: "text-[#22c55e]",
      path: "recharge",
    },
    {
      icon: CreditCard,
      label: "Withdraw Funds",
      color: "text-[#ef4444]",
      path: "withdraw",
    },
    {
      icon: History,
      label: "Recharge Record",
      color: "text-[#3b82f6]",
      path: "rechargeRecord",
    },
    {
      icon: History,
      label: "Withdraw Record",
      color: "text-[#f97316]",
      path: "withdrawRecord",
    },
    {
      icon: PieChart,
      label: "My Investments",
      color: "text-[#3b82f6]",
      path: "myInvestments",
    },
    {
      icon: Gift,
      label: "Redeem Code",
      color: "text-[#ec4899]",
      path: "redeemCode",
    },
    {
      icon: Receipt,
      label: "Transaction History",
      color: "text-[#0ea5e9]",
      path: "transactions",
    },
    {
      icon: Users,
      label: "Sales",
      color: "text-[#3b82f6]",
      path: "sales",
    },
  ];

  return (
    <div className="pb-28 bg-[#f8f9fa] min-h-screen">
      <div className="bg-[#2563eb] pt-10 pb-16 px-6 rounded-b-[2.5rem] relative mb-16">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            title="Change photo"
            className="relative w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-transparent overflow-hidden active:scale-95 transition-transform"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xl font-bold">
                {(userProfile?.displayName || "U").charAt(0).toUpperCase()}
              </span>
            )}
            {avatarUploading && (
              <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-[9px] font-bold text-white">
                ...
              </span>
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <span className="text-[#f8f9fa] text-[15px] tracking-wide">
            {userProfile?.displayName || userProfile?.bankDetails?.mobileNumber || "Add Phone No."}
          </span>
        </div>

        <div className="absolute -bottom-10 left-5 right-5 flex gap-4 pr-1">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 text-[11px] font-bold uppercase mb-2">
              BALANCE
            </p>
            <p className="text-[#2563eb] font-bold text-2xl">
              ₹{Number(userProfile?.balance || 0).toFixed(2)}
            </p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100 ml-1">
            <p className="text-gray-500 text-[11px] font-bold uppercase mb-2">
              COINS
            </p>
            <div className="flex items-center justify-center gap-1.5 font-bold text-2xl text-[#222]">
              <img src={coinSrc} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
              <span>{coins}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5">
        <div className="bg-white rounded-[1.25rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => item.path && onNavigate?.(item.path)}
              className="w-full flex items-center justify-between p-5 bg-white transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center bg-white ${item.color}`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px]`}
                    strokeWidth={2.5}
                  />
                </div>
                <span className="font-bold text-[#333] text-[15px]">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-[#fff] text-[#dc2626] font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-[#fef2f2] shadow-sm mb-4 bg-opacity-80"
          style={{ backgroundColor: "#fff5f5" }}
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={3} />
          Logout
        </button>
      </div>
    </div>
  );
};
