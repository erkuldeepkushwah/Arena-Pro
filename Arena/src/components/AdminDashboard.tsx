import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
  Menu,
  Users,
  Wallet,
  LayoutGrid,
  CheckCircle2,
  Settings,
  LogOut,
} from "lucide-react";
import {
  saveCricketMatches,
  saveQuizConfig,
  saveMatchRooms,
} from "../gameplayConfig";
import {
  useCricketMatches,
  useQuizConfig,
  useTournaments,
  useAllUsers,
  useEarnTasks,
  useWithdrawalRequests,
  useRechargeRequests,
  useProducts,
  useWelfareProducts
} from "../hooks/useFirebaseData";
import { saveEarnTasks } from "../gameplayConfig";
import { rtdb } from "../firebase";
import { logTransaction } from "../utils/transactions";
import { fileToImageDataUrl } from "../utils/imageUpload";

/** Swipe left to delete, swipe right to move the match to its next step. */
const SwipeToDelete: React.FC<{ onDelete: () => void; onAdvance?: () => void; children: React.ReactNode }> = ({ onDelete, onAdvance, children }) => (
  <div className="relative rounded-xl overflow-hidden mb-3">
    <div className="absolute inset-y-0 right-0 w-28 bg-red-500 flex items-center justify-end pr-3">
      <span className="text-white font-bold text-[12px] flex items-center gap-1">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </span>
    </div>
    {onAdvance && (
      <div className="absolute inset-y-0 left-0 w-28 bg-green-600 flex items-center justify-start pl-3">
        <span className="text-white font-bold text-[12px]">Next step</span>
      </div>
    )}
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: -90, right: onAdvance ? 90 : 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        // Only a full swipe counts — a half drag snaps back.
        if (onAdvance && info.offset.x >= 72) {
          onAdvance();
          return;
        }
        if (info.offset.x <= -72) onDelete();
      }}
      className="relative bg-white touch-pan-y"
    >
      {children}
    </motion.div>
  </div>
);

/** Matches marked "ended" are kept this long before the dashboard sweeps them. */
const FINISHED_RETENTION_MS = 24 * 60 * 60 * 1000;
import { ref, update, get, set, onValue, increment, runTransaction } from "firebase/database";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [rewardsExpanded, setRewardsExpanded] = useState(true);
  const [manageExpanded, setManageExpanded] = useState<number | null>(null);
  const [usersExpanded, setUsersExpanded] = useState(true);
  const [uiExpanded, setUiExpanded] = useState(false);
  const [logoExpanded, setLogoExpanded] = useState(false);
  const [coinExpanded, setCoinExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "users" | "payment" | "create" | "task" | "settings"
  >("dashboard");
  const [createTab, setCreateTab] = useState<
    "product" | "match" | "cricket" | "quiz" | "earn"
  >("product");
  const [expandedMatch, setExpandedMatch] = useState<any>(null);
  // Match/Cricket each have two pages: the list, and a separate Add Match page.
  // Cricket now mirrors Match: New / Upcoming / Live / Result.
  const [cricketTab, setCricketTab] = useState<"new" | "upcoming" | "live" | "result">("new");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [taskMenuOpen, setTaskMenuOpen] = useState(false);
  const [taskTab, setTaskTab] = useState<
    "reward" | "promotion" | "target" | "redeem"
  >("redeem");
  const [expandedQuizQ, setExpandedQuizQ] = useState<number | null>(null);
  const [expandedEarnTask, setExpandedEarnTask] = useState<number | null>(null);

  const goToSection = (id: string) => {
    setSidebarOpen(false);
    setActiveSection(id as typeof activeSection);
    if (id === "users") setUsersExpanded(true);
    if (id === "create") setCreateMenuOpen(true);
    if (id === "task") setTaskMenuOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz" | "earn") => {
    setCreateTab(tab);
    // Match and Cricket open on the Add Match panel, like the reference design.
    if (tab === "cricket") setCricketPage("add");
    setActiveSection("create");
    setCreateMenuOpen(true);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToTaskTab = (tab: "reward" | "promotion" | "target" | "redeem") => {
    setTaskTab(tab);
    setActiveSection("task");
    setRewardsExpanded(true);
    setTaskMenuOpen(true);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [cricketExpanded, setCricketExpanded] = useState(false);
  const [esportsExpanded, setEsportsExpanded] = useState(true);
  const [esportsTab, setEsportsTab] = useState<'new' | 'upcoming' | 'live' | 'result'>('new');
  const [quizExpanded, setQuizExpanded] = useState(false);
  const [bannersExpanded, setBannersExpanded] = useState(false);
  const [earnExpanded, setEarnExpanded] = useState(false);

  const firestoreCricket = useCricketMatches();
  const firestoreTournaments = useTournaments();
  const firestoreQuiz = useQuizConfig();
  const allUsers = useAllUsers();
  const firestoreEarnTasks = useEarnTasks();
  const withdrawRequests = useWithdrawalRequests();
  const rechargeRequests = useRechargeRequests();
  const firebaseProducts = useProducts();
  const firebaseWelfareProducts = useWelfareProducts();

  const handleDistributeCricketWinnings = async (matchId: string, winningTeam: string, entryFee: number) => {
    try {
      const updates: Record<string, any> = {};
      const paidUids: string[] = [];
      let distributedCount = 0;
      allUsers.forEach(u => {
        if (u.joinedMatches && u.joinedMatches[matchId] === winningTeam && !u.joinedMatches[`${matchId}_paid`]) {
           const currentCoins = u.coins || 0;
           updates[`users/${u.uid}/coins`] = currentCoins + (entryFee * 2);
           updates[`users/${u.uid}/joinedMatches/${matchId}_paid`] = true;
           paidUids.push(u.uid);
           distributedCount++;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
        await Promise.all(
          paidUids.map((uid) =>
            logTransaction(uid, {
              type: "winnings",
              amount: entryFee * 2,
              description: `Cricket winnings — ${winningTeam}`,
            }),
          ),
        );
        notify(`Distributed ${entryFee * 2} coins to ${distributedCount} winners!`);
      } else {
        notify("Recorded winners. No users found to receive reward, or already distributed.");
      }
    } catch (error) {
      console.error(error);
      notify("Failed to distribute winnings");
    }
  };

  const handleWithdrawAction = async (requestId: string, userId: string, amount: number, status: "approved" | "rejected") => {
    if (!userId) {
      notify("User ID is missing for this withdrawal request.", "error");
      return;
    }
    const requestRef = ref(rtdb, `withdrawalRequests/${userId}/${requestId}`);
    try {
      // Only act while the request is still pending. Without this check a
      // double-click (or two admins working at once) refunds/approves twice.
      const snap = await get(requestRef);
      if (!snap.exists()) {
        notify("This request no longer exists.", "error");
        return;
      }
      const current = snap.val();
      if (current?.status && current.status !== "pending") {
        notify(`Already ${current.status}.`, "info");
        return;
      }

      if (status === "rejected") {
        // Transaction instead of read-then-write, so concurrent wallet
        // changes are not silently lost.
        await runTransaction(
          ref(rtdb, `users/${userId}/balance`),
          (balance) => Number(balance || 0) + Number(amount),
        );
      }
      await update(requestRef, { status, handledAt: Date.now() });
      await logTransaction(userId, {
        type: status === "approved" ? "withdraw" : "refund",
        amount: Number(amount),
        description:
          status === "approved" ? "Withdrawal approved" : "Withdrawal rejected — refunded",
      });
      notify(
        status === "approved"
          ? `Withdrawal of \u20b9${Number(amount)} approved.`
          : `Withdrawal rejected \u2014 \u20b9${Number(amount)} refunded.`,
        status === "approved" ? "success" : "info",
      );
    } catch (error) {
      console.error(error);
      notify("Failed to process withdrawal.", "error");
    }
  };

  const handleRechargeAction = async (requestId: string, userId: string, amount: number, status: "approved" | "rejected") => {
    if (!userId) {
      notify("User ID is missing for this recharge request.", "error");
      return;
    }
    const requestRef = ref(rtdb, `rechargeRequests/${userId}/${requestId}`);
    try {
      const snap = await get(requestRef);
      if (!snap.exists()) {
        notify("This request no longer exists.", "error");
        return;
      }
      const current = snap.val();
      if (current?.status && current.status !== "pending") {
        notify(`Already ${current.status}.`, "info");
        return;
      }

      if (status === "approved") {
        await runTransaction(
          ref(rtdb, `users/${userId}/balance`),
          (balance) => Number(balance || 0) + Number(amount),
        );
      }
      await update(requestRef, { status, handledAt: Date.now() });
      if (status === "approved") {
        await logTransaction(userId, {
          type: "deposit",
          amount: Number(amount),
          description: "Wallet top-up approved",
        });
      }
      notify(
        status === "approved"
          ? `\u20b9${Number(amount)} added to the user's wallet.`
          : "Recharge request rejected.",
        status === "approved" ? "success" : "info",
      );
    } catch (error) {
      console.error(error);
      notify("Failed to process recharge.", "error");
    }
  };

  const [products, _setProducts] = useState<any[]>([]);
  const [cricketMatches, _setCricketMatches] = useState<any[]>([]);
  const [earnTasks, setEarnTasks] = useState<any[]>([]);
  const [quizConfig, _setQuizConfig] = useState<any>({
    entryFee: 10,
    questions: [],
  });
  const [tournaments, _setTournaments] = useState<any[]>([]);

  // Result entry lives in React state. It used to be read straight out of the
  // DOM with getElementById(`kills_input_...`), which quietly broke whenever the
  // markup around those inputs changed.
  const [resultDrafts, setResultDrafts] = useState<Record<string, { kills: number; isWinner: boolean }>>({});
  const draftKey = (tournamentId: string, uid: string) => `${tournamentId}__${uid}`;
  const draftFor = (tournamentId: string, uid: string, existing: any) =>
    resultDrafts[draftKey(tournamentId, uid)] ?? {
      kills: Number(existing?.kills) || 0,
      isWinner: !!existing?.isWinner,
    };
  const setDraft = (
    tournamentId: string,
    uid: string,
    patch: Partial<{ kills: number; isWinner: boolean }>,
  ) =>
    setResultDrafts((prev) => {
      const key = draftKey(tournamentId, uid);
      const base = prev[key] ?? { kills: 0, isWinner: false };
      return { ...prev, [key]: { ...base, ...patch } };
    });

  // Small inline toast, so admin feedback never blocks the UI thread the way
  // a browser alert does.
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // Editing a product/match used to hit Realtime Database on every keystroke.
  // Coalesce those writes into one per burst.
  const pendingWrites = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const debouncedSave = (key: string, fn: () => Promise<unknown> | void) => {
    if (pendingWrites.current[key]) clearTimeout(pendingWrites.current[key]);
    pendingWrites.current[key] = setTimeout(() => {
      Promise.resolve(fn()).catch(console.error);
    }, 500);
  };
  useEffect(
    () => () => {
      Object.values(pendingWrites.current).forEach(clearTimeout);
    },
    [],
  );

  const setProducts = (next: any[]) => {
    _setProducts(next);
    debouncedSave("products", async () => {
      const { saveProducts, saveWelfareProducts } = await import("../gameplayConfig");
      await Promise.all([
        saveProducts(next.filter((p) => !p.category || p.category === "daily")),
        saveWelfareProducts(next.filter((p) => p.category === "welfare")),
      ]);
    });
  };
  const setCricketMatches = (next: any[]) => {
    _setCricketMatches(next);
    debouncedSave("cricket", () => saveCricketMatches(next));
  };
  const setTournaments = (next: any[]) => {
    _setTournaments(next);
    debouncedSave("tournaments", () => saveMatchRooms(next));
  };
  const setQuizConfig = (next: any) => {
    _setQuizConfig(next);
    debouncedSave("quiz", () => saveQuizConfig(next));
  };

  /** Immutably replace one item of a list. Never mutates state objects. */
  const patchAt = <T,>(list: T[], index: number, patch: Partial<T>): T[] =>
    list.map((item, i) => (i === index ? { ...item, ...patch } : item));

  // ---- Site config (redeem code / payment QR / banners) -------------------
  const [siteCfg, setSiteCfg] = useState<any>({
    redeemCode: "",
    redeemAmount: "",
    paymentQr: "",
    logoUrl: "",
    coinIcon: "",
    banners: [],
  });
  useEffect(() => {
    const unsub = onValue(
      ref(rtdb, "global/siteConfig"),
      (snap) => {
        if (snap.exists()) setSiteCfg((prev: any) => ({ ...prev, ...snap.val() }));
      },
      console.error,
    );
    return () => unsub();
  }, []);

  const saveSiteConfig = async (patch: Record<string, any>) => {
    const next = { ...siteCfg, ...patch };
    setSiteCfg(next);
    try {
      await set(ref(rtdb, "global/siteConfig"), next);
      notify("Saved.", "success");
    } catch (error) {
      console.error(error);
      notify("Could not save.", "error");
    }
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coinInputRef = useRef<HTMLInputElement>(null);

  const handleSettingImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "logoUrl" | "coinIcon",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToImageDataUrl(file, 256);
      await saveSiteConfig({ [key]: dataUrl });
    } catch (err: any) {
      alert(err?.message || "Could not upload that image.");
    }
  };

  const updateBanner = (index: number, patch: { imageUrl?: string; targetUrl?: string }) => {
    const banners = [...(siteCfg.banners || [])];
    while (banners.length < 3) banners.push({});
    banners[index] = { ...banners[index], ...patch };
    setSiteCfg((prev: any) => ({ ...prev, banners }));
  };

  // Housekeeping: sweep matches that were marked "ended" more than a day ago.
  // Only rows carrying an `endedAt` stamp are eligible, so matches ended before
  // this shipped are never touched. Guarded to run once, otherwise a failed
  // write would bounce against the Firebase sync effect forever.
  const sweepRan = useRef(false);
  useEffect(() => {
    if (sweepRan.current || tournaments.length === 0) return;
    sweepRan.current = true;
    const cutoff = Date.now() - FINISHED_RETENTION_MS;
    const stale = tournaments.filter(
      (t: any) => t.status === "ended" && Number(t.endedAt) > 0 && Number(t.endedAt) < cutoff,
    );
    if (stale.length > 0) setTournaments(tournaments.filter((t: any) => !stale.includes(t)));
  }, [tournaments]);

  useEffect(() => {
    if (firestoreEarnTasks) setEarnTasks(firestoreEarnTasks);
  }, [firestoreEarnTasks]);

  useEffect(() => {
    if (firestoreCricket) _setCricketMatches(firestoreCricket);
  }, [firestoreCricket]);

  useEffect(() => {
    if (firestoreTournaments) _setTournaments(firestoreTournaments);
  }, [firestoreTournaments]);

  useEffect(() => {
    if (firestoreQuiz) _setQuizConfig(firestoreQuiz);
  }, [firestoreQuiz]);

  useEffect(() => {
    if (firebaseProducts.length > 0 || firebaseWelfareProducts.length > 0) {
      _setProducts([...firebaseProducts, ...firebaseWelfareProducts]);
    }
  }, [firebaseProducts, firebaseWelfareProducts]);

  const handleAddProduct = () => {
    const newProduct = {
      id: Date.now(),
      title: "New Product",
      price: 0,
      dailyIncome: 0,
      validDays: 0,
      totalIncome: 0,
      investAmount: 0,
      thumbnail: "https://via.placeholder.com/150",
      category: 'daily'
    };
    setProducts([newProduct, ...products]);
    setManageExpanded(newProduct.id);
    // The new product is prepended and opened; scroll the panel to the top so
    // the row you just created is the first thing you see.
    setTimeout(() => {
      document.getElementById("admin-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleRemoveProduct = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setProducts(products.filter((p) => p.id !== id));
    if (manageExpanded === id) setManageExpanded(null);
  };

  /** Creates a cricket match and opens the Match panel on it. */
  const createCricketMatch = () => {
                    const newMatch = {
                      id: Date.now(),
                      team1: { name: "Team A", short: "TMA" },
                      team2: { name: "Team B", short: "TMB" },
                      title: "New Match",
                      time: "Apr 12, 7:00 PM",
                      entryFee: 10,
                      status: "upcoming",
                    };
                    const newM = [newMatch, ...cricketMatches];
                    setCricketMatches(newM);
                    saveCricketMatches(newM);
                    setCricketExpanded(true);
                    setExpandedMatch(newMatch.id);
                    setCricketPage("add");
                    setTimeout(() => {
                      document.getElementById("admin-create")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 120);
                    window.dispatchEvent(new Event("admin_config_updated"));
                  };

  /** Creates an esports match and opens the Match panel on it. */
  const createTournament = () => {
                    const today = new Date().toISOString().slice(0, 10);
                    const newTournament = {
                      id: Date.now(),
                      game: "Free Fire Max",
                      title: "New Match",
                      date: today,
                      time: "08:00 PM",
                      entryFee: 10,
                      perKill: 5,
                      prizePool: 500,
                      matchType: "Squad",
                      map: "Bermuda",
                      status: "upcoming",
                      totalSlots: 40,
                      joinedPlayers: [],
                      roomDetails: { id: "", password: "" },
                      streamLink: "",
                      results: [],
                    };
                    const n = [newTournament, ...tournaments];
                    setTournaments(n);
                    saveMatchRooms(n);
                    // Stay on the New tab so the create form is visible.
                    setEsportsTab("new");
                    setEsportsExpanded(true);
                    setExpandedMatch(newTournament.id);
                    setTimeout(() => {
                      document.getElementById("admin-create")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 120);
                    window.dispatchEvent(new Event("admin_config_updated"));
                  };

  return (
    <div id="admin-top" className="min-h-screen bg-[#f4f5f7] pb-10 text-[#1f2937]">
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-lg shadow-lg text-white text-[13px] font-medium max-w-[90%] text-center whitespace-pre-line ${
            toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-gray-800"
          }`}
        >
          {toast.msg}
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm border-b border-gray-200 z-20 sticky top-0">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-50"
        >
          <Menu className="w-5 h-5 text-[#1f2937]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#1f2937] tracking-tight">
          Admin Panel
        </h1>
        <div className="w-10 h-10 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[265px] max-w-[82%] h-full bg-[#0b1b3f] text-white flex flex-col shadow-2xl">
            <div className="px-5 py-5 border-b border-white/10">
              <p className="text-[17px] font-bold">Arena Pro</p>
              <p className="text-[12px] text-white/60">Admin panel</p>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {[
                { id: "dashboard", label: "Dashboard", Icon: LayoutGrid },
                { id: "users", label: "Users", Icon: Users },
                { id: "payment", label: "Payment", Icon: Wallet },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === "create" ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
              >
                <Plus className="w-5 h-5" />
                Create
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform ${createMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {createMenuOpen && (
                <div className="pb-1">
                  {(["product", "match", "cricket", "quiz", "earn"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => goToCreateTab(tab)}
                      className={`w-full flex items-center gap-3 pl-12 pr-5 py-2.5 text-[14px] font-medium capitalize ${activeSection === "create" && createTab === tab ? "bg-white/10 text-white" : "text-white/70"} hover:bg-white/10`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => goToTaskTab("redeem")}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === "task" ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Task
              </button>

              {[
                { id: "settings", label: "Settings", Icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-5 py-5 text-[15px] font-medium text-red-300 border-t border-white/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </aside>
        </div>
      )}

      <div className="px-4 mt-6 space-y-6">
        {activeSection === "dashboard" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <p className="text-[16px] font-bold text-[#1f2937]">Welcome, admin</p>
            <p className="text-[13px] text-gray-500 mt-1">Choose a section from the menu.</p>
          </div>
        )}
        {/* Requests */}
        <div id="admin-payments" className={activeSection === "payment" ? "" : "hidden"}>
          <div className="bg-[#e5e7eb] px-4 py-3 rounded-t-lg">
            <h2 className="font-bold text-[#1f2937] text-[15px]">
              Recharge Requests
            </h2>
          </div>
          <div className="bg-[#f8f9fa] px-4 py-3 rounded-b-lg border border-gray-200 border-t-0 shadow-sm space-y-3">
            {rechargeRequests.filter(r => r.status === "pending").length > 0 ? (
              rechargeRequests.filter(r => r.status === "pending").map((req) => (
                <div key={req.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-[14px]">UID: {(req.uid || req.userId)?.slice(0, 8)}...</p>
                      <p className="text-[#16a34a] font-bold text-[15px]">Amount: ₹{req.amount}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Pending</span>
                  </div>
                  {req.utr && (
                    <div className="bg-gray-50 p-2 rounded text-[12px] text-gray-600 mb-3 border border-gray-100">
                      <p>UTR: <strong>{req.utr}</strong></p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleRechargeAction(req.id, req.uid || req.userId, req.amount, "approved")} className="flex-1 bg-green-600 text-white font-bold py-1.5 rounded text-[13px] hover:bg-green-700">Approve</button>
                    <button onClick={() => handleRechargeAction(req.id, req.uid || req.userId, req.amount, "rejected")} className="flex-1 bg-red-600 text-white font-bold py-1.5 rounded text-[13px] hover:bg-red-700">Reject</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-[15px]">No pending requests.</p>
            )}
          </div>
        </div>

        <div className={activeSection === "payment" ? "" : "hidden"}>
          <div className="bg-[#e5e7eb] px-4 py-3 rounded-t-lg">
            <h2 className="font-bold text-[#1f2937] text-[15px]">
              Withdrawal Requests
            </h2>
          </div>
          <div className="bg-[#f8f9fa] px-4 py-3 rounded-b-lg border border-gray-200 border-t-0 shadow-sm space-y-3">
            {withdrawRequests.filter(r => r.status === "pending").length > 0 ? (
              withdrawRequests.filter(r => r.status === "pending").map((req) => (
                <div key={req.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-[14px]">UID: {(req.uid || req.userId || "—").slice(0, 8)}...</p>
                      <p className="text-[#16a34a] font-bold text-[15px]">Amount: ₹{req.amount}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Pending</span>
                  </div>
                  {req.bankDetails && (
                    <div className="bg-gray-50 p-2 rounded text-[12px] text-gray-600 mb-3 border border-gray-100">
                      <p>Name: <strong>{req.bankDetails.name}</strong></p>
                      <p>A/C: <strong>{req.bankDetails.ac}</strong></p>
                      <p>IFSC: <strong className="uppercase">{req.bankDetails.ifsc}</strong></p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleWithdrawAction(req.id, req.uid, req.amount, "approved")} className="flex-1 bg-green-600 text-white font-bold py-1.5 rounded text-[13px] hover:bg-green-700">Approve</button>
                    <button onClick={() => handleWithdrawAction(req.id, req.uid, req.amount, "rejected")} className="flex-1 bg-red-600 text-white font-bold py-1.5 rounded text-[13px] hover:bg-red-700">Reject</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-[15px]">No pending requests.</p>
            )}
          </div>
        </div>

        {/* Daily Operations */}
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "task" ? "" : "hidden"}`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-[17px]">Daily</h2>
            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="p-4">
            <div
              className={`border border-gray-200 rounded-lg ${rewardsExpanded ? "shadow-sm" : ""}`}
            >
              <button
                onClick={() => setRewardsExpanded(!rewardsExpanded)}
                className={`flex justify-between items-center w-full p-4 font-bold text-[#374151] text-[15px] ${rewardsExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                Rewards & Simulation
                {rewardsExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {rewardsExpanded && (
                <div className="p-4 space-y-7">
                  <div className={`pt-2 `}>
                    <div className="border border-gray-200 rounded-xl p-4 bg-[#fafafa]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-[#4b5563] text-[13px] tracking-wide">
                          DAILY REDEEM CODE
                        </h3>
                        <button
                          onClick={() => goToTaskTab("redeem")}
                          className="text-[12px] font-bold text-[#2563eb]"
                        >
                          Manage Voucher
                        </button>
                      </div>
                    <div className="space-y-3">
                      <input
                        className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={siteCfg.redeemCode || ""}
                        onChange={(e) => setSiteCfg((prev: any) => ({ ...prev, redeemCode: e.target.value }))}
                        placeholder="Redeem code"
                      />
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={siteCfg.redeemAmount || ""}
                        onChange={(e) => setSiteCfg((prev: any) => ({ ...prev, redeemAmount: e.target.value }))}
                        placeholder="Reward amount"
                      />
                      <button
                        onClick={() =>
                          saveSiteConfig({
                            redeemCode: siteCfg.redeemCode || "",
                            redeemAmount: siteCfg.redeemAmount || "",
                          })
                        }
                        className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-medium py-2.5 rounded text-[15px] transition-colors shadow-sm"
                      >
                        Update Code
                      </button>
                    </div>
                    </div>
                  </div>

                  <div className={`border-t border-gray-200 pt-7 `}>
                    <h3 className={`font-bold text-[#4b5563] text-[15px] mb-3 `}>
                      System Date: {new Date().toISOString().slice(0, 10)}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            const updates: Record<string, any> = {};
                            allUsers.forEach((u) => {
                              if (u.investments && u.investments.length > 0) {
                                let changed = false;
                                const newInvests = u.investments.map((inv: any) => {
                                  if ((inv.progress || 0) < (inv.totalDays || 1)) {
                                    changed = true;
                                    return {
                                      ...inv,
                                      progress: (inv.progress || 0) + 1,
                                      unclaimedIncome: (inv.unclaimedIncome || 0) + (inv.dailyIncome || 0),
                                    };
                                  }
                                  return inv;
                                });
                                if (changed) {
                                  updates[`users/${u.uid}/investments`] = newInvests;
                                }
                              }
                            });
                            if (Object.keys(updates).length > 0) {
                              await update(ref(rtdb), updates);
                              notify("Advanced 1 Day. Investments progressed.");
                            } else {
                              notify("Advanced. No active investments.");
                            }
                          } catch (e) {
                            console.error(e);
                            notify("Failed to advance date.");
                          }
                        }}
                        className={`flex-1 bg-[#ea580c] text-white font-bold py-3 px-2 rounded flex items-center justify-center text-[13px] shadow-sm active:bg-orange-700 `}
                      >
                        Progress
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const topUsers = [...allUsers]
                              .filter(u => (u.coins || 0) > 0)
                              .sort((a, b) => (b.coins || 0) - (a.coins || 0))
                              .slice(0, 10);

                            if (topUsers.length === 0) {
                              notify("No users found with >0 coins to declare weekly results.");
                              return;
                            }

                            const updates: Record<string, any> = {};
                            const winnersInfo = [];
                            
                            for (let i = 0; i < topUsers.length; i++) {
                              const u = topUsers[i];
                              let prize = 0;
                              if (i === 0) prize = 100;
                              else if (i === 1) prize = 50;
                              else if (i === 2) prize = 20;
                              else if (i >= 3 && i <= 9) prize = 5;
                              
                              if (prize > 0) {
                                updates[`users/${u.uid}/balance`] = Number(u.balance || 0) + prize;
                                updates[`users/${u.uid}/weeklyWinnerAt`] = Date.now();
                                updates[`users/${u.uid}/weeklyWinnerPrize`] = prize;
                                updates[`users/${u.uid}/weeklyWinnerRank`] = i + 1;
                                
                                winnersInfo.push({
                                  uid: u.uid,
                                  name: u.displayName || u.bankDetails?.mobileNumber || u.email || `Player ${u.uid.slice(0,5)}`,
                                  prize,
                                  rank: i + 1,
                                });
                              }
                            }

                            // Publish a small public leaderboard node, so clients can
                            // render "Top Promotion" without reading every user record.
                            updates["topPromotions"] = Object.fromEntries(
                              winnersInfo.slice(0, 3).map((w) => [
                                w.rank,
                                {
                                  id: w.rank,
                                  name: w.name,
                                  amount: w.prize,
                                  cup: w.rank === 1 ? "🏆" : w.rank === 2 ? "🥈" : "🥉",
                                },
                              ]),
                            );

                            // Optional: Reset coins for next week, but we'll leave it as is so they don't lose them entirely unless requested
                            if (Object.keys(updates).length > 0) {
                              await update(ref(rtdb), updates);
                              await Promise.all(
                                winnersInfo.map((w: any) =>
                                  logTransaction(w.uid, {
                                    type: "prize",
                                    amount: w.prize,
                                    description: `Weekly leaderboard rank #${w.rank}`,
                                  }),
                                ),
                              );
                              
                              let message = "Weekly Results Declared!\n\n";
                              winnersInfo.forEach(w => {
                                message += `Rank ${w.rank}: ${w.name} - Won ₹${w.prize}\n`;
                              });
                              message += "\nAmounts have been added to their wallets.";
                              notify(message);
                            }
                          } catch (e) {
                            console.error(e);
                            notify("Failed to declare weekly results.");
                          }
                        }}
                        className={`flex-1 bg-[#eab308] text-white font-bold py-3 px-2 rounded flex flex-col items-center justify-center gap-1 text-[13px] shadow-sm active:bg-yellow-600 `}>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" /> Promotion
                        </div>
                      </button>
                    </div>
                    <p className={`text-[11px] text-gray-500 mt-2 font-medium `}>
                      "Promotion" distributes prizes to Top 10 (₹100, ₹50, ₹20, and ₹5 for 4th-10th)
                    </p>
                    <button
                      onClick={async () => {
                        if (!confirm("Are you sure you want to let all users play tasks again?")) return;
                        try {
                          const updates: Record<string, any> = {};
                          allUsers.forEach((u) => {
                            if (u.claimedEarnTasks) {
                              updates[`users/${u.uid}/claimedEarnTasks`] = null;
                            }
                          });
                          if (Object.keys(updates).length > 0) {
                            await update(ref(rtdb), updates);
                          }
                          notify("All user tasks have been renewed (reset)!");
                        } catch (e) {
                          console.error(e);
                          notify("Failed to renew tasks.");
                        }
                      }}
                      className={`w-full bg-[#f59e0b] hover:bg-orange-600 text-white font-bold py-3 mt-4 rounded flex items-center justify-center text-sm shadow-sm transition-colors `}
                    >
                      Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manage Products */}
        <div id="admin-products" className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" && createTab === "product" ? "" : "hidden"}`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-[17px]">
              Product
              <span className="ml-2 text-[13px] font-medium text-gray-400">
                {products.length} items
              </span>
            </h2>
            <button
              onClick={handleAddProduct}
              className="bg-[#2563eb] hover:bg-blue-700 text-white p-1.5 rounded transition-colors shadow-sm"
              title="Add Product"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {/* Whatever row is open is rendered first, so the card you are
                editing is always the one at the top of the list. Render-time
                ordering only — the saved order is untouched. */}
            {(manageExpanded == null
              ? products
              : [...products].sort((a, b) =>
                  a.id === manageExpanded ? -1 : b.id === manageExpanded ? 1 : 0,
                )
            ).map((product) => {
              const isExpanded = manageExpanded === product.id;

              return (
                <div
                  key={product.id}
                  className={`border border-gray-200 rounded-lg ${isExpanded ? "shadow-sm" : ""}`}
                >
                  <button
                    onClick={() =>
                      setManageExpanded(isExpanded ? null : product.id)
                    }
                    className={`w-full p-3 flex justify-between items-center transition-colors ${isExpanded ? "bg-[#f8f9fa] rounded-t-lg border-b border-gray-200" : "bg-white rounded-lg"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                        <img
                          src={product.thumbnail}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                          alt=""
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-[#1f2937] text-[15px] leading-tight">
                          {product.title}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                          DAILY • ₹{product.validDays ? (product.totalIncome / product.validDays).toFixed(2).replace(/\.00$/, '') : 0}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-500 w-5 h-5 shrink-0" />
                    ) : (
                      <ChevronDown className="text-gray-500 w-5 h-5 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                          PLAN CATEGORY
                        </label>
                        <select 
                          className="w-full border border-gray-200 rounded p-2.5 bg-white text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={product.category || 'daily'}
                          onChange={(e) => {
                            setProducts(products.map((p) => (p.id === product.id ? { ...p, category: e.target.value } : p)));
                          }}
                        >
                          <option value="daily">Daily Plan</option>
                          <option value="welfare">Welfare Plan</option>
                        </select>
                      </div>
                      {product.category === 'welfare' && (
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                            COUNTDOWN (Optional)
                          </label>
                          <select
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            value={product.countdownHours || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProducts(
                                products.map((p) => {
                                  if (p.id !== product.id) return p;
                                  const { countdownHours, endTime, ...rest } = p;
                                  return val
                                    ? { ...rest, countdownHours: val, endTime: Date.now() + parseInt(val) * 3600000 }
                                    : rest;
                                }),
                              );
                            }}
                          >
                            <option value="">None</option>
                            <option value="2">2 Hours</option>
                            <option value="5">5 Hours</option>
                            <option value="10">10 Hours</option>
                            <option value="24">24 Hours</option>
                            <option value="48">48 Hours</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                          PRODUCT NAME
                        </label>
                        <input
                          className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={product.title}
                          onChange={(e) => {
                            setProducts(products.map((p) => (p.id === product.id ? { ...p, title: e.target.value } : p)));
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                          IMAGE URL
                        </label>
                        <input
                          className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={product.thumbnail}
                          onChange={(e) => {
                            setProducts(products.map((p) => (p.id === product.id ? { ...p, thumbnail: e.target.value } : p)));
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                            PRICE
                          </label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={product.price}
                            onChange={(e) => {
                              setProducts(products.map((p) => (p.id === product.id ? { ...p, price: Number(e.target.value) } : p)));
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                            DAYS
                          </label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={product.validDays}
                            onChange={(e) => {
                              setProducts(products.map((p) => (p.id === product.id ? { ...p, validDays: Number(e.target.value) } : p)));
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                            TOTAL INCOME
                          </label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={product.totalIncome}
                            onChange={(e) => {
                              setProducts(products.map((p) => (p.id === product.id ? { ...p, totalIncome: Number(e.target.value) } : p)));
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 mt-2 border-t border-gray-200">

                        <button
                          onClick={(e) => handleRemoveProduct(e, product.id)}
                          className="flex-1 flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 text-[#ef4444] font-bold py-2.5 rounded text-[15px] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Product
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Manage Play Games */}
        <div id="admin-create" className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" && createTab !== "product" && createTab !== "earn" ? "" : "hidden"}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-[17px] capitalize">
              {createTab === "cricket" ? "Cricket" : createTab === "match" ? "Match" : "Quiz"}
              <span className="ml-2 text-[13px] font-medium text-gray-400 normal-case">
                {createTab === "cricket"
                  ? `${cricketMatches.length} matches`
                  : createTab === "match"
                    ? `${tournaments.length} matches`
                    : `${quizConfig?.questions?.length || 0} questions`}
              </span>
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Cricket Matches Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${cricketExpanded ? "shadow-sm" : ""} ${createTab === "cricket" ? "" : "hidden"}`}
            >
              <div
                className={`flex justify-between items-center w-full p-4 ${cricketExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setCricketExpanded(!cricketExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Matches
                  {cricketExpanded ? (
                    <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                  )}
                </button>
              </div>

              {cricketExpanded && (
                <div className="p-4 space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['new', 'upcoming', 'live', 'result'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          if (tab === "new" && expandedMatch == null) {
                            createCricketMatch();
                            return;
                          }
                          setCricketTab(tab);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize ${cricketTab === tab ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Same as Product: whatever row is open is rendered first. */}
                  {cricketMatches
                    .filter((m: any) => {
                      if (cricketTab === 'new') return m.id === expandedMatch;
                      if (cricketTab === 'upcoming') return (m.status || 'upcoming') === 'upcoming';
                      if (cricketTab === 'live') return m.status === 'live';
                      return m.status === 'ended';
                    })
                    .sort((a: any, b: any) =>
                      a.id === expandedMatch ? -1 : b.id === expandedMatch ? 1 : 0,
                    )
                    .map((match: any, _i: number) => {
                      // The list is filtered, so map's index is not the source index.
                      const index = cricketMatches.findIndex((m: any) => m.id === match.id);
                      return (
                    <SwipeToDelete
                      key={match.id}
                      onDelete={() => {
                        if (!window.confirm("Delete this match?")) return;
                        const n = cricketMatches.filter((m: any) => m.id !== match.id);
                        setCricketMatches(n);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                    >
                    <div
                      key={match.id}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm relative"
                    >
                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {match.title || "Untitled match"}
                          </p>
                          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {match.team1?.short || "T1"} vs {match.team2?.short || "T2"}
                            {match.time ? ` - ${match.time}` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.status === "live" ? "bg-red-50 text-red-600" : match.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"}`}>
                              {(match.status || "upcoming").toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              Entry {match.entryFee || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              {allUsers.filter((u) => u.joinedMatches && u.joinedMatches[match.id]).length} joined
                            </span>
                          </div>
                        </div>
                      </div>

                      {cricketTab === "new" && expandedMatch === match.id && (
                        <>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <input
                          className="border border-gray-300 rounded p-1 text-sm font-bold w-1/2"
                          value={match.title}
                          onChange={(e) => {
                            setCricketMatches(patchAt(cricketMatches, index, { title: e.target.value }));
                          }}
                          onBlur={() => {
                            saveCricketMatches(cricketMatches);
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        />
                        <select
                          className={`text-xs font-bold px-2 py-1 rounded border ${match.status === "live" ? "bg-red-50 text-red-600 border-red-200" : match.status === "ended" ? "bg-gray-100 text-gray-600 border-gray-300" : "bg-purple-50 text-purple-600 border-purple-200"}`}
                          value={match.status}
                          onChange={(e) => {
                            setCricketMatches(patchAt(cricketMatches, index, { status: e.target.value }));
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="live">LIVE</option>
                          <option value="ended">ENDED</option>
                        </select>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {match.status === "live" && (
                          <button
                            onClick={() => {
                              setCricketMatches(patchAt(cricketMatches, index, { status: "ended" }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-gray-800 text-white font-bold py-1.5 rounded text-xs"
                          >
                            End Match - enter score
                          </button>
                        )}
                        {match.status === "ended" && (
                          <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5 w-full text-center">
                            Match ended - pick the winning team below to pay out.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEAM 1 (Short)
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded p-1.5 text-sm uppercase"
                            value={match.team1.short}
                            onChange={(e) => {
                              setCricketMatches(
                                patchAt(cricketMatches, index, {
                                  team1: {
                                    ...cricketMatches[index].team1,
                                    short: e.target.value,
                                    name: e.target.value,
                                  },
                                }),
                              );
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEAM 2 (Short)
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded p-1.5 text-sm uppercase"
                            value={match.team2.short}
                            onChange={(e) => {
                              setCricketMatches(
                                patchAt(cricketMatches, index, {
                                  team2: {
                                    ...cricketMatches[index].team2,
                                    short: e.target.value,
                                    name: e.target.value,
                                  },
                                }),
                              );
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEAM 1 LOGO URL
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded p-1.5 text-sm"
                            placeholder="https://..."
                            value={match.team1.logoUrl || ""}
                            onChange={(e) => {
                              setCricketMatches(patchAt(cricketMatches, index, { team1: { ...(cricketMatches[index].team1 || {}), logoUrl: e.target.value } }));
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEAM 2 LOGO URL
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded p-1.5 text-sm"
                            placeholder="https://..."
                            value={match.team2.logoUrl || ""}
                            onChange={(e) => {
                              setCricketMatches(patchAt(cricketMatches, index, { team2: { ...(cricketMatches[index].team2 || {}), logoUrl: e.target.value } }));
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            DATE & TIME
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Apr 12, 7:00 PM"
                            className="w-full border border-gray-200 rounded p-1.5 text-sm"
                            value={match.time}
                            onChange={(e) => {
                              setCricketMatches(patchAt(cricketMatches, index, { time: e.target.value }));
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            ENTRY FEE (Coins)
                          </label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded p-1.5 text-sm"
                            value={match.entryFee}
                            onChange={(e) => {
                              setCricketMatches(patchAt(cricketMatches, index, { entryFee: Number(e.target.value) }));
                            }}
                            onBlur={() => {
                              saveCricketMatches(cricketMatches);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs font-bold text-gray-600 bg-gray-100 p-2 rounded flex justify-between items-center border border-gray-200">
                          <span>JOINED PLAYERS:</span>
                          <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            {allUsers.filter((u) => u.joinedMatches && u.joinedMatches[match.id]).length} Joined
                          </span>
                        </div>
                        {allUsers.filter((u) => u.joinedMatches && u.joinedMatches[match.id]).length > 0 && (
                          <div className="mt-2 text-[11px] border border-gray-200 rounded p-2 bg-white space-y-1.5 max-h-32 overflow-y-auto">
                            {allUsers.filter((u) => u.joinedMatches && u.joinedMatches[match.id]).map((u) => (
                              <div key={u.uid} className="flex justify-between items-center text-gray-700">
                                <span>{u.bankDetails?.mobileNumber || "Player"}</span>
                                <span className="font-bold text-gray-500">[{u.joinedMatches[match.id]}]</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Distribution (End Match) */}
                      {(match.status === "live" || match.status === "ended") && (
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-3">
                          <label className="text-[10px] text-blue-700 font-bold block mb-1">
                            LIVE SCORE UPDATES
                          </label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 border border-blue-200 rounded p-1 text-xs"
                              placeholder={`${match.team1.short} Score`}
                              value={match.liveDetails?.team1Score || ""}
                              onChange={(e) => {
                                setCricketMatches(
                                  patchAt(cricketMatches, index, {
                                    liveDetails: {
                                      ...(cricketMatches[index].liveDetails || {}),
                                      team1Score: e.target.value,
                                    },
                                  }),
                                );
                              }}
                              onBlur={() => {
                                saveCricketMatches(cricketMatches);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                            <input
                              className="flex-1 border border-blue-200 rounded p-1 text-xs"
                              placeholder={`${match.team2.short} Score`}
                              value={match.liveDetails?.team2Score || ""}
                              onChange={(e) => {
                                setCricketMatches(
                                  patchAt(cricketMatches, index, {
                                    liveDetails: {
                                      ...(cricketMatches[index].liveDetails || {}),
                                      team2Score: e.target.value,
                                    },
                                  }),
                                );
                              }}
                              onBlur={() => {
                                saveCricketMatches(cricketMatches);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {match.status === "ended" && (
                        <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-3 flex flex-col gap-2">
                          <label className="text-[10px] text-yellow-800 font-bold">
                            SET WINNING TEAM (Distribute 2x Coins)
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCricketMatches(patchAt(cricketMatches, index, { winningTeam: match.team1.short }));
                                handleDistributeCricketWinnings(match.id, match.team1.short, match.entryFee);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                              className={`flex-1 py-1.5 rounded text-xs font-bold ${match.winningTeam === match.team1.short ? "bg-yellow-400 text-yellow-900 border border-yellow-500" : "bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-100"}`}
                            >
                              {match.team1.short} Won
                            </button>
                            <button
                              onClick={() => {
                                setCricketMatches(patchAt(cricketMatches, index, { winningTeam: match.team2.short }));
                                handleDistributeCricketWinnings(match.id, match.team2.short, match.entryFee);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                              className={`flex-1 py-1.5 rounded text-xs font-bold ${match.winningTeam === match.team2.short ? "bg-yellow-400 text-yellow-900 border border-yellow-500" : "bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-100"}`}
                            >
                              {match.team2.short} Won
                            </button>
                          </div>
                        </div>
                      )}

                      </div>
                        </>
                      )}

                      <div className="flex justify-end pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const n = cricketMatches.filter(
                              (_, i) => i !== index,
                            );
                            setCricketMatches(n);
                            saveCricketMatches(n);
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div></SwipeToDelete>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Add Match lives on its own page, above the list */}
            {/* eSports Tournaments Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${esportsExpanded ? "shadow-sm" : ""} ${createTab === "match" ? "" : "hidden"}`}
            >
              {esportsExpanded && (
                <div className="p-4 space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['new', 'upcoming', 'live', 'result'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          if (tab === "new" && expandedMatch == null) {
                            createTournament();
                            return;
                          }
                          setEsportsTab(tab);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize ${esportsTab === tab ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {tournaments.filter((t: any) => {
                    if (esportsTab === 'upcoming') return t.status === 'upcoming';
                    if (esportsTab === 'live') return t.status === 'live';
                    if (esportsTab === 'result') return t.status === 'ended';
                    if (esportsTab === 'new') return t.id === expandedMatch; // only the match being edited
                    return false;
                  })
                  // Same as Product: whatever row is open is rendered first.
                  // filter() already returned a fresh array, so sorting is safe.
                  .sort((a: any, b: any) =>
                    a.id === expandedMatch ? -1 : b.id === expandedMatch ? 1 : 0,
                  )
                  .map((t: any) => {
                    const index = tournaments.findIndex((tr: any) => tr.id === t.id);
                    return (
                    <SwipeToDelete
                      key={t.id}
                      onAdvance={() => {
                        const next =
                          t.status === "upcoming" ? "live" : t.status === "live" ? "ended" : "upcoming";
                        setTournaments(
                          patchAt(tournaments, index, {
                            status: next,
                            ...(next === "live" ? { liveAt: Date.now() } : {}),
                            ...(next === "ended" ? { endedAt: Date.now() } : {}),
                          }),
                        );
                        setEsportsTab(next === "ended" ? "result" : next === "live" ? "live" : "upcoming");
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      onDelete={() => {
                        if (!window.confirm("Delete this match?")) return;
                        const n = tournaments.filter((tr: any) => tr.id !== t.id);
                        setTournaments(n);
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                    >
                    <div
                      key={t.id}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm relative"
                    >
                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setExpandedMatch(expandedMatch === t.id ? null : t.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {t.title || "Untitled match"}
                          </p>
                          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {t.game || "Game"}
                            {t.matchType ? ` - ${t.matchType}` : ""}
                            {t.map ? ` - ${t.map}` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.status === "live" ? "bg-red-50 text-red-600" : t.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"}`}>
                              {(t.status || "upcoming").toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              Entry {t.entryFee || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              {allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).length} / {t.totalSlots || 0} joined
                            </span>
                          </div>
                        </div>
                      </div>

                      {esportsTab === "new" && expandedMatch === t.id && (
                        <>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <select
                          className="border border-gray-300 rounded p-1 text-sm font-bold w-1/3"
                          value={t.game}
                          onChange={(e) => {
                            setTournaments(patchAt(tournaments, index, { game: e.target.value }));
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        >
                          <option value="Free Fire Max">Free Fire Max</option>
                          <option value="BGMI">BGMI</option>
                          <option value="Call of Duty">Call of Duty</option>
                          <option value="Scarfall 2.0">Scarfall 2.0</option>
                        </select>

                        <select
                          className={`text-xs font-bold px-2 py-1 rounded border ${t.status === "live" ? "bg-red-50 text-red-600 border-red-200" : t.status === "ended" ? "bg-gray-100 text-gray-600 border-gray-300" : "bg-purple-50 text-purple-600 border-purple-200"}`}
                          value={t.status}
                          onChange={(e) => {
                            setTournaments(
                              patchAt(tournaments, index, {
                                status: e.target.value,
                                ...(e.target.value === "live" ? { liveAt: Date.now() } : {}),
                                ...(e.target.value === "ended" ? { endedAt: Date.now() } : {}),
                              }),
                            );
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="live">LIVE</option>
                          <option value="ended">ENDED</option>
                        </select>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {t.status === "live" && (
                          <button
                            onClick={() => {
                              setTournaments(patchAt(tournaments, index, { status: "ended", endedAt: Date.now() }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-gray-800 text-white font-bold py-1.5 rounded text-xs"
                          >
                            End Match
                          </button>
                        )}
                        {t.status === "ended" && (
                          <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5 w-full text-center">
                            Match ended - open the Result tab to enter kills and pay out.
                          </p>
                        )}
                      </div>

                      {(esportsTab === "upcoming" || esportsTab === "new") && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            placeholder="Match Title"
                            value={t.title}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { title: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                          <select
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            value={t.matchType}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { matchType: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          >
                            <option value="Solo">Solo</option>
                            <option value="Duo">Duo</option>
                            <option value="Squad">Squad</option>
                          </select>
                          <input
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            type="date"
                            value={t.date}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { date: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                          <input
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            type="time"
                            value={t.time}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { time: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                          <select
                            className="border border-gray-200 p-1.5 text-xs rounded bg-white text-gray-700 h-8"
                            value={t.map}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { map: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          >
                            <option value="">Select Map</option>
                            {(t.game === "Free Fire Max" ? ["Bermuda", "Kalahari", "Purgatory", "Alpine", "NeXTerra", "Solara"] :
                              t.game === "BGMI" ? ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Karakin"] :
                              t.game === "Call of Duty" ? ["Nuketown", "Crash", "Firing Range", "Raid", "Terminal", "Standoff", "Crossfire"] :
                              t.game === "Scarfall 2.0" ? ["Desert Map", "Factory Area", "Military Base", "Power Plant", "Port Area", "Town Area"] : 
                              []).map(mapName => (
                                <option key={mapName} value={mapName}>{mapName}</option>
                            ))}
                          </select>
                          <input
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            type="number"
                            placeholder="Total Slots"
                            value={t.totalSlots}
                            onChange={(e) => {
                              const totalSlots = Number(e.target.value);
                              const E = tournaments[index].entryFee || 0;
                              const N = totalSlots || 0;
                              setTournaments(
                                patchAt(tournaments, index, {
                                  totalSlots,
                                  ...(E > 0 && N > 1
                                    ? {
                                        prizePool: Math.floor(E * N * 0.2),
                                        perKill: Math.floor((E * N * 0.3) / (N - 1)),
                                      }
                                    : {}),
                                }),
                              );
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      )}

                      {(esportsTab === "upcoming" || esportsTab === "new") && (
                        <div className="grid grid-cols-3 gap-2 mb-3 bg-white p-2 rounded border border-gray-100">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold block">
                              ENTRY FEE
                            </label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded p-1 text-xs"
                              value={t.entryFee}
                              onChange={(e) => {
                                const entryFee = Number(e.target.value);
                                const E = entryFee || 0;
                                const N = tournaments[index].totalSlots || 0;
                                setTournaments(
                                  patchAt(tournaments, index, {
                                    entryFee,
                                    ...(E > 0 && N > 1
                                      ? {
                                          prizePool: Math.floor(E * N * 0.2),
                                          perKill: Math.floor((E * N * 0.3) / (N - 1)),
                                        }
                                      : {}),
                                  }),
                                );
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold block">
                              PER KILL
                            </label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded p-1 text-xs"
                              value={t.perKill}
                              onChange={(e) => {
                                setTournaments(patchAt(tournaments, index, { perKill: Number(e.target.value) }));
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold block">
                              PRIZE POOL
                            </label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded p-1 text-xs"
                              value={t.prizePool}
                              onChange={(e) => {
                                setTournaments(patchAt(tournaments, index, { prizePool: Number(e.target.value) }));
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {((esportsTab === "upcoming" || esportsTab === "new") || esportsTab === "live" || esportsTab === "result") && (
                        <div className="mb-3">
                          <div className="text-xs font-bold text-gray-600 bg-gray-100 p-2 rounded flex justify-between items-center border border-gray-200">
                            <span>JOINED PLAYERS:</span>
                            <span
                              className={
                                allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).length >= t.totalSlots
                                  ? "text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100"
                                  : "text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100"
                              }
                            >
                              {allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).length} / {t.totalSlots} Joined
                            </span>
                          </div>
                        </div>
                      )}

                      {(
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-3">
                          <label className="text-[10px] text-blue-700 font-bold block mb-2">
                            ROOM ID & PASSWORD (Only visible to joined players)
                          </label>
                          <div className="flex gap-2 mb-2">
                            <input
                              className="flex-1 border border-blue-200 rounded p-1 text-xs"
                              placeholder="Room ID"
                              value={t.roomDetails?.id || ""}
                              onChange={(e) => {
                                setTournaments(
                                  patchAt(tournaments, index, {
                                    roomDetails: {
                                      ...{ id: "", password: "" },
                                      ...(tournaments[index].roomDetails || {}),
                                      id: e.target.value,
                                    },
                                  }),
                                );
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                            <input
                              className="flex-1 border border-blue-200 rounded p-1 text-xs"
                              placeholder="Password"
                              value={t.roomDetails?.password || ""}
                              onChange={(e) => {
                                setTournaments(
                                  patchAt(tournaments, index, {
                                    roomDetails: {
                                      ...{ id: "", password: "" },
                                      ...(tournaments[index].roomDetails || {}),
                                      password: e.target.value,
                                    },
                                  }),
                                );
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="text-[10px] text-blue-700 font-bold block mb-1">
                              COUNTDOWN (MINUTES)
                            </label>
                            <select
                              className="w-full border border-blue-200 rounded p-1 text-xs"
                              value={t.countdownMin || 5}
                              onChange={(e) => {
                                setTournaments(patchAt(tournaments, index, { countdownMin: Number(e.target.value) }));
                                window.dispatchEvent(new Event("admin_config_updated"));
                              }}
                            >
                              <option value={5}>5 minutes</option>
                              <option value={10}>10 minutes</option>
                            </select>
                          </div>
                          <input
                            className="w-full border border-blue-200 rounded p-1 text-xs"
                            placeholder="Live Stream URL (optional)"
                            value={t.streamLink || ""}
                            onChange={(e) => {
                              setTournaments(patchAt(tournaments, index, { streamLink: e.target.value }));
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      )}

                      {esportsTab === "result" && (
                        <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-3 flex flex-col gap-2">
                          <label className="text-[10px] text-yellow-800 font-bold">
                            DECLARE RESULT (Distribute Coins)
                          </label>

                          {/* List of joined users with inputs */}
                          <div className="bg-white border border-yellow-200 rounded max-h-64 overflow-y-auto">
                            {allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).length > 0 ? (
                              allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id)).map((u: any) => {
                                const existingResult = t.results?.find((r: any) => r.uid === u.uid) || { kills: 0, isWinner: false, distributed: false };
                                
                                return (
                                <div key={u.uid} className="flex gap-2 items-center p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-xs truncate">
                                      {u.tournamentDetails?.[t.id]?.inGameName || u.bankDetails?.mobileNumber || "Player"}
                                    </div>
                                    <div className="text-[9px] text-gray-500 truncate">{u.uid}</div>
                                  </div>
                                  
                                  {existingResult.distributed ? (
                                    <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded">
                                      ✓ Coins Distributed
                                    </span>
                                  ) : (
                                    <>
                                      <input
                                        type="number"
                                        className="w-12 border border-gray-200 rounded p-1 text-xs text-center"
                                        placeholder="Kills"
                                        value={draftFor(t.id, u.uid, existingResult).kills}
                                        onChange={(e) =>
                                          setDraft(t.id, u.uid, { kills: Number(e.target.value) || 0 })
                                        }
                                      />
                                      <label className="flex items-center gap-1 text-[10px] whitespace-nowrap bg-gray-50 p-1 border border-gray-200 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={draftFor(t.id, u.uid, existingResult).isWinner}
                                          onChange={(e) => setDraft(t.id, u.uid, { isWinner: e.target.checked })}
                                        />
                                        Win?
                                      </label>
                                    </>
                                  )}
                                </div>
                              )})
                            ) : (
                              <div className="p-2 text-xs text-gray-500 text-center">No players joined this match.</div>
                            )}
                          </div>

                          <button
                            onClick={async () => {
                              const players = allUsers.filter((u: any) => u.joinedTournaments?.includes(t.id));
                              if (players.length === 0) return;
                              
                              const existingResults: any[] = tournaments[index].results || [];
                              const newResults = [...existingResults];
                              let totalDistributed = 0;

                              for (const u of players) {
                                const existingResult = newResults.find((r: any) => r.uid === u.uid);
                                if (existingResult?.distributed) continue;

                                const draft = draftFor(t.id, u.uid, existingResult);
                                const kills = Number(draft.kills) || 0;
                                const isWinner = !!draft.isWinner;
                                const reward = kills * (t.perKill || 0) + (isWinner ? t.prizePool || 0 : 0);

                                if (reward > 0) {
                                  // increment() replaces the read-modify-write that
                                  // could drop coins, and the require() call that
                                  // threw "require is not defined" in the browser.
                                  await update(ref(rtdb, `users/${u.uid}`), {
                                    coins: increment(reward),
                                  });
                                  await logTransaction(u.uid, {
                                    type: "winnings",
                                    amount: reward,
                                    description: `${t.game || t.title || "Tournament"} result — ${kills} kills`,
                                  });
                                }

                                const resultData = {
                                  uid: u.uid,
                                  playerName: u.tournamentDetails?.[t.id]?.inGameName || "Player",
                                  kills,
                                  isWinner,
                                  reward,
                                  distributed: true,
                                };

                                if (existingResult) {
                                  Object.assign(existingResult, resultData);
                                } else {
                                  newResults.push(resultData);
                                }
                                totalDistributed += reward;
                              }

                              setTournaments(patchAt(tournaments, index, { results: newResults }));
                              setResultDrafts({});
                              window.dispatchEvent(new Event("admin_config_updated"));
                              notify(`Distributed ${totalDistributed} coins to players.`, "success");
                            }}
                            className="bg-yellow-400 font-bold py-2 rounded text-yellow-900 border border-yellow-500 shadow-sm text-xs w-full mt-1 hover:bg-yellow-500 transition-colors"
                          >
                            Add Results & Distribute Coins
                          </button>
                        </div>
                      )}

                      {esportsTab === "ended" && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              // Distribute logic can stay here
                            }}
                            className="bg-yellow-400 font-bold py-2 rounded text-yellow-900 border border-yellow-500 shadow-sm text-xs w-full mt-1 hover:bg-yellow-500 transition-colors hidden"
                          >
                            Add Results & Distribute Coins
                          </button>
                        </div>
                      )}

                      </div>
                        </>
                      )}

                    </div></SwipeToDelete>
                  )})}
                </div>
              )}
            </div>

            {/* Quiz Settings Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${quizExpanded ? "shadow-sm" : ""} ${createTab === "quiz" ? "" : "hidden"}`}
            >
              <div
                className={`flex justify-between items-center w-full p-4 ${quizExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setQuizExpanded(!quizExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Questions
                  {quizExpanded ? (
                    <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                  )}
                </button>
              </div>

              {quizExpanded && (
                <div className="p-4 space-y-4">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        ENTRY FEE (Coins)
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded p-1.5 text-sm"
                        value={quizConfig.entryFee}
                        onChange={(e) => {
                          const n = { ...quizConfig };
                          n.entryFee = Number(e.target.value);
                          setQuizConfig(n);
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-gray-500 font-bold block border-b border-gray-200 pb-1">
                        QUESTIONS (Max 5)
                      </label>
                      {quizConfig.questions.map((q: any, qIndex: number) => (
                        <div
                          key={qIndex}
                          className="bg-white border text-sm border-gray-200 rounded-lg p-3 shadow-sm relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-gray-400">Q{qIndex + 1}</span>
                              <p className="font-semibold text-[13px] text-[#111] truncate">{q.q || "Untitled question"}</p>
                            </div>
                            <button
                              onClick={() => setExpandedQuizQ(expandedQuizQ === qIndex ? null : qIndex)}
                              className="shrink-0 text-[11px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-2.5 py-1 rounded-lg"
                            >
                              {expandedQuizQ === qIndex ? "Close" : "Edit"}
                            </button>
                          </div>
                          {expandedQuizQ === qIndex && (
                          <div className="mt-2">
                          <input
                            className="w-full border border-gray-300 rounded p-1.5 mb-2 font-semibold"
                            value={q.q}
                            onChange={(e) => {
                              const n = { ...quizConfig };
                              n.questions[qIndex].q = e.target.value;
                              setQuizConfig(n);
                            }}
                          />
                          <div className="grid grid-cols-1 gap-1">
                            {q.options.map((opt: string, oIndex: number) => (
                              <div
                                key={oIndex}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={`q_${qIndex}`}
                                  checked={q.correctIdx === oIndex}
                                  onChange={() => {
                                    const n = { ...quizConfig };
                                    n.questions[qIndex].correctIdx = oIndex;
                                    setQuizConfig(n);
                                  }}
                                />
                                <input
                                  className="flex-1 border border-gray-200 rounded p-1 text-xs"
                                  value={opt}
                                  onChange={(e) => {
                                    const n = { ...quizConfig };
                                    n.questions[qIndex].options[oIndex] =
                                      e.target.value;
                                    setQuizConfig(n);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          </div>
                          )}
                        </div>
                      ))}
                      
                      {quizConfig.questions.length < 5 && (
                        <button
                          onClick={() => {
                            const n = { ...quizConfig };
                            if (!n.questions) n.questions = [];
                            n.questions.push({
                              q: "New question",
                              options: ["Op A", "Op B", "Op C", "Op D"],
                              correctIdx: 0,
                            });
                            setQuizConfig(n);
                          }}
                          className="w-full bg-[#f8f9fa] border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm shadow-sm hover:bg-gray-100 transition-colors"
                        >
                          + Add Question
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* End Manage Play Games wrapper */}
          </div>
        </div>

        {/* Earn Tasks */}
        <div id="admin-task" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "create" && createTab === "earn" ? "" : "hidden"}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-[17px]">Earn</h2>
          </div>
          <div className="p-4">
            <div className={`border border-gray-200 rounded-lg ${earnExpanded ? "shadow-sm" : ""}`}>
              <div className={`flex justify-between items-center w-full p-4 ${earnExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}>
                <button
                  onClick={() => setEarnExpanded(!earnExpanded)}
                  className="flex-1 text-left font-bold text-[#374151] text-[15px]"
                >
                  Tasks
                </button>
                {earnExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                )}
              </div>
              
              {earnExpanded && (
                 <div className="p-4 space-y-4">
                    {earnTasks.map((task, index) => (
                      <div key={task.id} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex flex-col gap-2">
                         <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-sm truncate">{task.title || "Untitled task"}</span>
                            <button
                              onClick={() => setExpandedEarnTask(expandedEarnTask === index ? null : index)}
                              className="shrink-0 text-[11px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-2.5 py-1 rounded-lg"
                            >
                              {expandedEarnTask === index ? "Close" : "Edit"}
                            </button>
                         </div>
                         {expandedEarnTask === index && (
                         <div className="flex flex-col gap-2">
                         <div>
                            <label className="text-[11px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">URL</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={task.url}
                              onChange={(e) => {
                                 setEarnTasks(patchAt(earnTasks, index, { url: e.target.value }));
                              }}
                              onBlur={() => {
                                 saveEarnTasks(earnTasks);
                              }}
                            />
                         </div>
                         <div>
                            <label className="text-[11px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">Coins</label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={task.coins}
                              onChange={(e) => {
                                 setEarnTasks(patchAt(earnTasks, index, { coins: Number(e.target.value) }));
                              }}
                              onBlur={() => {
                                 saveEarnTasks(earnTasks);
                              }}
                            />
                         </div>
                         </div>
                         )}
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "settings" ? "" : "hidden"}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-[17px]">Banner</h2>
          </div>
          <div className="p-4">
            <div className={`border border-gray-200 rounded-lg ${bannersExpanded ? "shadow-sm" : ""}`}>
              <button
                onClick={() => setBannersExpanded(!bannersExpanded)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${bannersExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                Banner
                {bannersExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {bannersExpanded && (
                <div className="p-4 space-y-7">
                  <div>
                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-4">
                      Banner (3 Images)
                    </h3>
                    <div className="space-y-5">
                      {[0, 1, 2].map((slide) => (
                        <div
                          key={slide}
                          className="border border-gray-200 rounded-lg p-3 space-y-3 relative pt-4 bg-gray-50"
                        >
                          <p className="text-[11px] font-bold text-[#4b5563] bg-white border border-gray-200 px-1.5 absolute -top-2 left-3 rounded">
                            Slide #{slide + 1}
                          </p>
                          <input
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={siteCfg.banners?.[slide]?.imageUrl || ""}
                            onChange={(e) => updateBanner(slide, { imageUrl: e.target.value })}
                            placeholder="Image URL"
                          />
                          <input
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={siteCfg.banners?.[slide]?.targetUrl || ""}
                            onChange={(e) => updateBanner(slide, { targetUrl: e.target.value })}
                            placeholder="Target URL (e.g., YouTube or Telegram)"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => saveSiteConfig({ banners: siteCfg.banners || [] })}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2.5 rounded text-[15px] mt-4 transition-colors shadow-sm"
                    >
                      Update Banners
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div id="admin-settings" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2 ${activeSection === "settings" || activeSection === "users" ? "" : "hidden"}`}>
          <div className={activeSection === "settings" ? "p-4 border-b border-gray-100" : "hidden"}>
            <h2 className="font-bold text-[17px]">General</h2>
          </div>
          <div className="p-4 space-y-4">
            <div
              className={`border border-gray-200 rounded-lg ${logoExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}
            >
              <button
                onClick={() => setLogoExpanded(!logoExpanded)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${logoExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                App Logo
                {logoExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {logoExpanded && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
                    >
                      {siteCfg.logoUrl ? (
                        <img src={siteCfg.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">Upload</span>
                      )}
                    </button>
                    <div className="text-[12px] text-gray-500 leading-snug">
                      Tap the box to pick an image.
                      {siteCfg.logoUrl && (
                        <button
                          onClick={() => saveSiteConfig({ logoUrl: "" })}
                          className="block text-red-600 font-bold mt-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSettingImage(e, "logoUrl")}
                  />
                </div>
              )}
            </div>

            <div
              className={`border border-gray-200 rounded-lg ${coinExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}
            >
              <button
                onClick={() => setCoinExpanded(!coinExpanded)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${coinExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                Coin Icon
                {coinExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {coinExpanded && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => coinInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
                    >
                      {siteCfg.coinIcon ? (
                        <img src={siteCfg.coinIcon} alt="Coin Icon" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">Upload</span>
                      )}
                    </button>
                    <div className="text-[12px] text-gray-500 leading-snug">
                      Tap the box to pick an image.
                      {siteCfg.coinIcon && (
                        <button
                          onClick={() => saveSiteConfig({ coinIcon: "" })}
                          className="block text-red-600 font-bold mt-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={coinInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSettingImage(e, "coinIcon")}
                  />
                </div>
              )}
            </div>

            <div
              className={`border border-gray-200 rounded-lg ${uiExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}
            >
              <button
                onClick={() => setUiExpanded(!uiExpanded)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${uiExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                QR
                {uiExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {uiExpanded && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                      Payment QR Code URL
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={siteCfg.paymentQr || ""}
                      onChange={(e) => setSiteCfg((prev: any) => ({ ...prev, paymentQr: e.target.value }))}
                      placeholder="https://.../qr.png"
                    />
                    <button
                      onClick={() => saveSiteConfig({ paymentQr: siteCfg.paymentQr || "" })}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2.5 rounded text-[15px] mt-3 transition-colors shadow-sm"
                    >
                      Update QR
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              id="admin-users"
              className={`border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""} ${activeSection === "users" ? "" : "hidden"}`}
            >
              <button
                onClick={() => setUsersExpanded(!usersExpanded)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${usersExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                Users
                {usersExpanded ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {usersExpanded && (
                <div className="p-4 bg-[#f8f9fa]/50">
                  <p className="font-bold text-[15px] text-[#374151] mb-3 leading-none">
                    Total Users: {allUsers.length}
                  </p>

                  <div className="space-y-3">
                    {allUsers.map((user: any, idx: number) => (
                      <div
                        key={user.uid || idx}
                        className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-[15px] text-[#1f2937] leading-tight mb-0.5">
                              {user.bankDetails?.mobileNumber || user.email || `Player ${(user.uid || "").slice(0, 5)}`}
                            </p>
                            <p className="text-gray-400 text-[13px] mb-0.5" title={user.uid}>
                              UID: {(user.uid || "—").slice(0, 8)}...
                            </p>
                          </div>
                          <button onClick={async () => {
                            if (window.confirm("Delete this user's database record?\n\nNote: this does NOT delete their login \u2014 remove the account in Firebase Authentication too, otherwise the profile is recreated on their next sign-in.")) {
                              await update(ref(rtdb), {
                                [`users/${user.uid}`]: null
                              });
                              notify("User deleted!");
                            }
                          }} className="bg-red-50 hover:bg-red-100 text-[#ef4444] font-bold px-3.5 py-1.5 rounded transition-colors text-[13px]">
                            Delete
                          </button>
                        </div>
                        <div className="flex gap-4 border-t border-gray-100 pt-2 mt-1">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Wallet</p>
                            <p className="text-[#16a34a] font-bold text-[13px]">₹{user.balance || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Coins</p>
                            <p className="text-[#d97706] font-bold text-[13px]">{user.coins || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
