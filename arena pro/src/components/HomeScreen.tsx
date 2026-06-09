import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  Plus,
  ArrowRight,
  Megaphone,
  Tag,
  Gift,
  Headphones,
  Coins,
  Bell,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";
import { useUserProfile, useTopPromotions, useAllUsers } from "../hooks/useFirebaseData";
import { useNotifications } from "../hooks/useNotifications";
import { playCoinSound, playNotificationSound } from "../utils/sounds";

interface HomeScreenProps {
  onNavigate: (page: string) => void;
  onTabChange?: (tab: string) => void;
}

// Admin can edit these banners and add image URLs
const BANNERS = [
  {
    id: 1,
    title: "Invite Friends",
    subtitle: "Earn Rewards",
    buttonText: "Invite Now",
    action: "promotion",
    bgClass: "bg-[#f0eaff]",
    textColor: "text-[#6D28D9]",
    buttonClass: "bg-[#6D28D9] text-white",
    emoji: "🎁",
    imageUrl: "", // Admin: Add image URL here (e.g., "https://example.com/banner.jpg")
  },
  {
    id: 2,
    title: "Special Offers",
    subtitle: "Buy Coins",
    buttonText: "View Offers",
    action: "offers",
    bgClass: "bg-[#fff4ed]",
    textColor: "text-[#c2410c]",
    buttonClass: "bg-[#c2410c] text-white",
    emoji: "🪙",
    imageUrl: "",
  },
  {
    id: 3,
    title: "Play Games",
    subtitle: "Win Daily",
    buttonText: "Play Now",
    action: "play",
    bgClass: "bg-[#f0f9ff]",
    textColor: "text-[#0369a1]",
    buttonClass: "bg-[#0369a1] text-white",
    emoji: "🎮",
    imageUrl: "",
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onTabChange,
}) => {
  const userName =
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split("@")[0] ||
    "User";
  const [activeSlide, setActiveSlide] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dismissedNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDismissNotification = (id: string) => {
    const updated = [...dismissedNotifs, id];
    setDismissedNotifs(updated);
    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));
  };

  const userProfile = useUserProfile();
  const notifications = useNotifications();
  const visibleNotifications = notifications.filter((n) => !dismissedNotifs.includes(n.id));
  const unreadCount = visibleNotifications.length > 0 ? visibleNotifications.length : 0;
  
  const prevNotifIdsRef = useRef<string[]>([]);
  const isDataLoadedRef = useRef(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState<{show: boolean, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);

  useEffect(() => {
    if (userProfile && !isDataLoadedRef.current) {
      const timer = setTimeout(() => {
        isDataLoadedRef.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  // Use a stringified version of IDs to avoid running effect on every render
  const visibleNotifsStr = visibleNotifications.map(n => n.id).join(',');

  useEffect(() => {
    const currentIds = visibleNotifsStr ? visibleNotifsStr.split(',') : [];
    
    if (isDataLoadedRef.current) {
      const newNotifs = visibleNotifications.filter(n => !prevNotifIdsRef.current.includes(n.id));
      if (newNotifs.length > 0) {
        playNotificationSound();
        const latestNotif = newNotifs[0]; // Show the first new notification
        setShowCongratsPopup({
          show: true,
          title: latestNotif.title,
          message: latestNotif.message,
          type: (latestNotif.type as any) || 'info'
        });
        // Auto dismiss popup after 5 seconds
        setTimeout(() => {
          setShowCongratsPopup(null);
        }, 5000);
      }
    }
    
    prevNotifIdsRef.current = currentIds;
  }, [visibleNotifsStr]); // ONLY depend on the stringified IDs


  const coins = userProfile?.coins || 0;
  
  const allUsers = useAllUsers();
  
  // Calculate top 3 by coins for Top Promotion
  const topPromoters = [...allUsers]
    .filter(u => (u.coins || 0) > 0)
    .sort((a, b) => (b.coins || 0) - (a.coins || 0))
    .slice(0, 3);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pb-28 bg-[#f8f9fe] min-h-screen font-sans relative">
      <AnimatePresence>
        {showCongratsPopup?.show && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className={`fixed top-12 left-4 right-4 z-[999] bg-white rounded-[24px] p-6 shadow-xl border-2 overflow-hidden ${
              showCongratsPopup.type === 'error' ? 'border-red-400' : 'border-green-400'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
              showCongratsPopup.type === 'error' ? 'from-red-400 to-rose-500' : 'from-green-400 to-emerald-500'
            }`}></div>
            <div className="flex flex-col items-center text-center">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl ${
                 showCongratsPopup.type === 'error' ? 'bg-red-100' : 'bg-green-100'
               }`}>
                  {showCongratsPopup.type === 'error' ? '❌' : '🎉'}
               </div>
               <h3 className="text-xl font-black text-gray-900 leading-tight mb-2 uppercase tracking-wide">
                 {showCongratsPopup.title}
               </h3>
               <p className={`text-[15px] font-bold ${
                 showCongratsPopup.type === 'error' ? 'text-red-600' : 'text-green-600'
               }`}>
                 {showCongratsPopup.message}
               </p>
               <button 
                 onClick={() => setShowCongratsPopup(null)}
                 className="mt-6 font-bold text-gray-400 hover:text-gray-600 text-sm"
               >
                 Dismiss
               </button>
            </div>
            
            {/* Confetti pieces only for success */}
            {showCongratsPopup.type === 'success' && (
              <>
                <div className="absolute top-10 left-10 w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 right-10 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-6 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full bg-[#5b21b6] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Welcome back,</p>
            <p className="text-gray-900 font-bold text-[17px] flex items-center gap-1">
              {userName} <span className="text-xl">👋</span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            playCoinSound();
            setShowNotifications(true);
          }}
          className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center shadow-sm relative text-[#5b21b6] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute 1 top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
          )}
        </button>
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-[#6D28D9] to-[#4c1d95] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-purple-500/30">
          {/* Background decoration */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-10 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <span className="text-sm font-medium">Total Balance</span>
              <Eye className="w-4 h-4" />
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-semibold">{coins} Coins</span>
            </div>
          </div>

          <div className="relative z-10 mb-6">
            <span className="text-[34px] font-bold tracking-tight">
              ₹ {Number(userProfile?.balance || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3 relative z-10">
            <button
              onClick={() => onNavigate("recharge")}
              className="flex-1 bg-white text-[#6D28D9] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-[15px]"
            >
              <Plus className="w-5 h-5" /> Add Money
            </button>
            <button
              onClick={() => onNavigate("withdraw")}
              className="flex-1 bg-transparent border border-white/40 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-[15px] hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 grid grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: Megaphone,
            label: "Promotion",
            action: () => onNavigate("promotion"),
          },
          { icon: Tag, label: "Offers", action: () => onNavigate("offers") },
          {
            icon: Gift,
            label: "Rewards",
            action: () => onTabChange?.("rewards"),
          },
          {
            icon: Coins,
            label: "Earn",
            action: () => onNavigate("earn"),
          },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100">
              <item.icon className="w-7 h-7 text-[#6D28D9]" strokeWidth={1.5} />
            </div>
            <span className="text-[12px] font-medium text-gray-700">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Promotional Banner Slider */}
      <div className="px-5 mb-8">
        <div className="relative rounded-3xl overflow-hidden h-36 shadow-sm border border-gray-100/50">
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {BANNERS.map((banner) => (
              <div
                key={banner.id}
                className={`min-w-full h-full relative ${banner.bgClass} p-5 flex items-center`}
                style={
                  banner.imageUrl
                    ? {
                        backgroundImage: `url(${banner.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {!banner.imageUrl && (
                  <>
                    <div className="z-10 w-3/5">
                      <p className="text-gray-900 font-bold mb-1 text-[15px] drop-shadow-sm">
                        {banner.title}
                      </p>
                      <p
                        className={`${banner.textColor} font-bold text-[22px] leading-tight mb-3`}
                      >
                        {banner.subtitle}
                      </p>
                      <button
                        onClick={() => {
                          if (
                            banner.action === "promotion" ||
                            banner.action === "offers"
                          )
                            onNavigate(banner.action);
                          else if (banner.action === "play")
                            onTabChange?.("play");
                        }}
                        className={`${banner.buttonClass} px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-black/5 active:scale-95 transition-transform`}
                      >
                        {banner.buttonText}
                      </button>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-40 flex items-center justify-center text-[80px] drop-shadow-2xl opacity-90 select-none pointer-events-none">
                      {banner.emoji}
                    </div>
                  </>
                )}
                {/* Overlay for clicking the entire image banner if provided */}
                {banner.imageUrl && (
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => {
                      if (
                        banner.action === "promotion" ||
                        banner.action === "offers"
                      )
                        onNavigate(banner.action);
                      else if (banner.action === "play") onTabChange?.("play");
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Pagination Indicators */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
            {BANNERS.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide
                    ? "w-5 bg-gray-800"
                    : "w-2 bg-gray-800/20 hover:bg-gray-800/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top Promotion */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#1f2937] font-bold text-[18px]">
            Top Promotion
          </h2>
          <button className="text-[#6D28D9] font-bold text-[14px]">
            View All
          </button>
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          {topPromoters.length > 0 ? (
            topPromoters.map((user, idx) => {
              const name = user.displayName || user.bankDetails?.mobileNumber || user.email?.split("@")[0] || `Player ${user.uid.slice(0,5)}`;
              const cup = idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
              
              return (
                <div
                  key={user.uid}
                  className="flex justify-between items-center py-3 px-2 sm:py-4 sm:px-4 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <span className="text-2xl sm:text-3xl drop-shadow-md shrink-0 text-center w-[36px]">{cup}</span>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg sm:text-xl overflow-hidden shrink-0">
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
                    <div className="text-green-600 font-bold text-[13px] sm:text-[16px] flex items-center gap-1 mt-0.5">
                      ₹{idx === 0 ? 100 : idx === 1 ? 50 : idx === 2 ? 25 : 0}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">No promotions yet</div>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setShowNotifications(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-full max-w-sm h-full bg-[#f8f9fe] shadow-2xl flex flex-col transform transition-transform">
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
              <h2 className="text-[#1f2937] font-bold text-[18px]">Notifications</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 pb-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-[15px]">No notifications yet</p>
                </div>
              ) : (
                <AnimatePresence>
                  {visibleNotifications.map((notif) => (
                    <motion.div 
                      key={notif.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
                      drag="x"
                      dragDirectionLock
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.8}
                      onDragEnd={(e, { offset, velocity }) => {
                        if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 300) {
                          handleDismissNotification(notif.id);
                        }
                      }}
                      className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 touch-pan-y ${
                        notif.type === 'success' ? 'border-green-500' : 
                        notif.type === 'error' ? 'border-red-500' : 
                        'border-purple-500'
                      }`}
                    >
                      <div className="flex items-start gap-3 pointer-events-none">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#1f2937] text-[15px] mb-1 leading-snug">{notif.title}</h3>
                          <p className="text-gray-600 text-[13px] leading-relaxed break-words whitespace-pre-wrap">{notif.message}</p>
                          <p className="text-gray-400 text-[11px] mt-2 font-medium">
                            {new Date(notif.time).toLocaleString([], {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
