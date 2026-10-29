import React, { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { Navigation } from "./components/Navigation";
import { HomeScreen } from "./components/HomeScreen";
import { ProductScreen } from "./components/ProductScreen";
import { PlayScreen } from "./components/PlayScreen";
import { OffersScreen } from "./components/OffersScreen";
import { PromotionScreen } from "./components/PromotionScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { RewardsScreen } from "./components/RewardsScreen";
import { PaymentFlow } from "./components/PaymentFlow";
import { RechargeRecord } from "./components/RechargeRecord";
import { WithdrawScreen } from "./components/WithdrawScreen";
import { WithdrawRecordScreen } from "./components/WithdrawRecordScreen";
import { MyInvestments } from "./components/MyInvestments";
import { RedeemCode } from "./components/RedeemCode";
import { SalesRecord } from "./components/SalesRecord";
import { EarnScreen } from "./components/EarnScreen";
import { TransactionHistory } from "./components/TransactionHistory";
import { AdminDashboard } from "./components/AdminDashboard";
import { auth, rtdb } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

type Tab = "home" | "product" | "play" | "profile" | "rewards";
type Page =
  | "dashboard"
  | "recharge"
  | "withdraw"
  | "rechargeRecord"
  | "withdrawRecord"
  | "myInvestments"
  | "redeemCode"
  | "sales"
  | "promotion"
  | "offers"
  | "earn"
  | "transactions";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        try {
          const { update, ref } = await import("firebase/database");
          const userRef = ref(rtdb, `users/${user.uid}`);
          const updateData: any = {
            email: user.email || null,
          };
          if (user.displayName) {
             updateData.displayName = user.displayName;
          }
          await update(userRef, updateData);

          // Publish this player's own shareable code so a friend's sign-up can
          // resolve it to a uid. Codes are meant to be shared, so this node is
          // readable by any signed-in user — the users node is not.
          await update(ref(rtdb, `referralIndex/${user.uid.slice(0, 8).toUpperCase()}`), user.uid);
        } catch (err) {
          console.error("Failed to sync user data", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      const target = e.detail;
      if (target === 'payment' || target === 'recharge') {
        setActivePage('recharge');
        setActiveTab('home');
      }
    };
    window.addEventListener('navigate-to', handleNavigate);
    return () => window.removeEventListener('navigate-to', handleNavigate);
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#2563eb] animate-spin" />
      </div>
    );
  }

  if (isOutdated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-12 max-w-sm w-full pt-10">
          <h1 className="text-[#333] text-[17px] leading-relaxed">
            App is outdated and needs to be upgraded by the owner.
          </h1>
          <button
            onClick={() => setIsOutdated(false)}
            className="bg-[#eff6ff] text-[#2563eb] font-medium py-3 px-6 rounded-full text-[15px]"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const isAdmin = auth.currentUser?.email === "125607@clorigo.com";

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] font-sans">
        <main className="max-w-md mx-auto relative bg-[#f8f9fa] min-h-screen border-x border-gray-200/50 shadow-sm overflow-x-hidden">
          <AdminDashboard onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  const renderContent = () => {
    if (activePage === "recharge") {
      return (
        <PaymentFlow
          onBack={() => setActivePage("dashboard")}
          onComplete={() => {
            setActivePage("dashboard");
            setActiveTab("home");
          }}
        />
      );
    }

    if (activePage === "withdraw") {
      return <WithdrawScreen onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "withdrawRecord") {
      return <WithdrawRecordScreen onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "rechargeRecord") {
      return <RechargeRecord onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "myInvestments") {
      return <MyInvestments onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "redeemCode") {
      return <RedeemCode onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "sales") {
      return <SalesRecord onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "promotion") {
      return <PromotionScreen onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "offers") {
      return <OffersScreen onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "earn") {
      return <EarnScreen onBack={() => setActivePage("dashboard")} />;
    }

    if (activePage === "transactions") {
      return <TransactionHistory onBack={() => setActivePage("dashboard")} />;
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            onNavigate={(page) => setActivePage(page as Page)}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
        );
      case "product":
        return <ProductScreen />;
      case "play":
        return <PlayScreen />;
      case "rewards":
        return <RewardsScreen />;
      case "profile":
        return (
          <ProfileScreen
            onLogout={handleLogout}
            onNavigate={(page) => setActivePage(page as Page)}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigate={(page) => setActivePage(page as Page)}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <main className="max-w-md mx-auto relative bg-[#f8f9fa] min-h-screen border-x border-gray-200/50 shadow-sm overflow-x-hidden">
        {renderContent()}

        {activePage === "dashboard" && (
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </main>
    </div>
  );
}
