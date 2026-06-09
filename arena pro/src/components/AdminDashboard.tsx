import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/src/constants";
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
import { ref, update, get } from "firebase/database";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [rewardsExpanded, setRewardsExpanded] = useState(true);
  const [manageExpanded, setManageExpanded] = useState<number | null>(null);
  const [usersExpanded, setUsersExpanded] = useState(true);
  const [uiExpanded, setUiExpanded] = useState(false);
  const [cricketExpanded, setCricketExpanded] = useState(false);
  const [esportsExpanded, setEsportsExpanded] = useState(false);
  const [esportsTab, setEsportsTab] = useState<'upcoming' | 'live' | 'result' | 'ended'>('upcoming');
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
      let distributedCount = 0;
      allUsers.forEach(u => {
        if (u.joinedMatches && u.joinedMatches[matchId] === winningTeam && !u.joinedMatches[`${matchId}_paid`]) {
           const currentCoins = u.coins || 0;
           updates[`users/${u.uid}/coins`] = currentCoins + (entryFee * 2);
           updates[`users/${u.uid}/joinedMatches/${matchId}_paid`] = true;
           distributedCount++;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
        alert(`Distributed ${entryFee * 2} coins to ${distributedCount} winners!`);
      } else {
        alert("Recorded winners. No users found to receive reward, or already distributed.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to distribute winnings");
    }
  };

  const handleWithdrawAction = async (requestId: string, userId: string, amount: number, status: "approved" | "rejected") => {
    try {
      if (!userId) {
        alert("Error: User ID is missing for this withdrawal request!");
        return;
      }
      if (status === "rejected") {
        const userRef = ref(rtdb, `users/${userId}`);
        const userSnap = await get(userRef);
        const currentBalance = Number(userSnap.val()?.balance || 0);
        const newBalance = currentBalance + Number(amount);
        await update(userRef, { balance: newBalance });
        alert(`Refunded ₹${Number(amount)} back to user. New balance: ${newBalance}`);
      }
      await update(ref(rtdb, `withdrawalRequests/${requestId}`), {
        status,
        handledAt: Date.now(),
      });
      alert(`Withdrawal request marked as ${status}`);
    } catch (error) {
      console.error(error);
      alert("Failed to process withdrawal: " + String(error));
    }
  };

  const handleRechargeAction = async (requestId: string, userId: string, amount: number, status: "approved" | "rejected") => {
    try {
      if (!userId) {
        alert("Error: User ID is missing for this request!");
        return;
      }
      if (status === "approved") {
        const userRef = ref(rtdb, `users/${userId}`);
        const userSnap = await get(userRef);
        const currentBalance = Number(userSnap.val()?.balance || 0);
        const newBalance = currentBalance + Number(amount);
        
        await update(userRef, { balance: newBalance });
        alert(`Successfully added ${Number(amount)} to user. New balance: ${newBalance}`);
      }

      await update(ref(rtdb, `rechargeRequests/${requestId}`), {
        status,
        handledAt: Date.now(),
      });
      alert(`Recharge request marked as ${status}`);
    } catch (error) {
      console.error(error);
      alert("Failed to process recharge: " + String(error));
    }
  };

  const [products, _setProducts] = useState<any[]>([]);
  const setProducts = (newProducts: any[]) => {
    _setProducts(newProducts);
    import("../gameplayConfig").then(({ saveProducts, saveWelfareProducts }) => {
      saveProducts(newProducts.filter(p => !p.category || p.category === 'daily'));
      saveWelfareProducts(newProducts.filter(p => p.category === 'welfare'));
    });
  };
  const [cricketMatches, _setCricketMatches] = useState<any[]>([]);
  const setCricketMatches = (val: any[]) => {
    _setCricketMatches(val);
    saveCricketMatches(val);
  };
  const [earnTasks, setEarnTasks] = useState<any[]>([]);
  const [quizConfig, _setQuizConfig] = useState<any>({
    entryFee: 10,
    questions: [],
  });
  const setQuizConfig = (val: any) => {
    _setQuizConfig(val);
    saveQuizConfig(val);
  };
  const [tournaments, _setTournaments] = useState<any[]>([]);
  const setTournaments = (val: any[]) => {
    _setTournaments(val);
    saveMatchRooms(val);
  };

  useEffect(() => {
    if (firestoreEarnTasks && firestoreEarnTasks.length > 0)
      setEarnTasks(firestoreEarnTasks);
  }, [firestoreEarnTasks]);

  useEffect(() => {
    if (firestoreCricket && firestoreCricket.length > 0)
      _setCricketMatches(firestoreCricket);
  }, [firestoreCricket]);

  useEffect(() => {
    if (firestoreTournaments && firestoreTournaments.length > 0)
      _setTournaments(firestoreTournaments);
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
  };

  const handleRemoveProduct = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setProducts(products.filter((p) => p.id !== id));
    if (manageExpanded === id) setManageExpanded(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-10 text-[#1f2937]">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <h1 className="text-[22px] font-bold text-[#1f2937] tracking-tight">
          Admin Dashboard
        </h1>
        <button
          onClick={onLogout}
          className="bg-[#ef4444] text-white px-5 py-1.5 rounded font-medium shadow-sm transition-colors active:bg-red-600"
        >
          Exit
        </button>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Requests */}
        <div>
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

        <div>
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
                      <p className="font-bold text-[14px]">UID: {req.uid.slice(0, 8)}...</p>
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-[17px]">Daily</h2>
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
                  <div className="pt-2">
                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-3">
                      Daily Redeem Code
                    </h3>
                    <div className="space-y-3">
                      <input
                        className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        defaultValue="POZZY10"
                      />
                      <input
                        className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        defaultValue="10"
                      />
                      <button className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-medium py-2.5 rounded text-[15px] transition-colors shadow-sm">
                        Update Code
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-7">
                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-3">
                      System Date: 2025-10-10
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
                              alert("Advanced 1 Day. Investments progressed.");
                            } else {
                              alert("Advanced. No active investments.");
                            }
                          } catch (e) {
                            console.error(e);
                            alert("Failed to advance date.");
                          }
                        }}
                        className="flex-1 bg-[#ea580c] text-white font-bold py-3 px-2 rounded flex items-center justify-center text-[13px] shadow-sm active:bg-orange-700"
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
                              alert("No users found with >0 coins to declare weekly results.");
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
                                  name: u.displayName || u.bankDetails?.mobileNumber || u.email || `Player ${u.uid.slice(0,5)}`,
                                  prize,
                                  rank: i + 1,
                                });
                              }
                            }

                            // Optional: Reset coins for next week, but we'll leave it as is so they don't lose them entirely unless requested
                            if (Object.keys(updates).length > 0) {
                              await update(ref(rtdb), updates);
                              
                              let message = "Weekly Results Declared!\n\n";
                              winnersInfo.forEach(w => {
                                message += `Rank ${w.rank}: ${w.name} - Won ₹${w.prize}\n`;
                              });
                              message += "\nAmounts have been added to their wallets.";
                              alert(message);
                            }
                          } catch (e) {
                            console.error(e);
                            alert("Failed to declare weekly results.");
                          }
                        }}
                        className="flex-1 bg-[#eab308] text-white font-bold py-3 px-2 rounded flex flex-col items-center justify-center gap-1 text-[13px] shadow-sm active:bg-yellow-600">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" /> Promotion
                        </div>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 font-medium">
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
                          alert("All user tasks have been renewed (reset)!");
                        } catch (e) {
                          console.error(e);
                          alert("Failed to renew tasks.");
                        }
                      }}
                      className="w-full bg-[#f59e0b] hover:bg-orange-600 text-white font-bold py-3 mt-4 rounded flex items-center justify-center text-sm shadow-sm transition-colors"
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-[17px]">Product</h2>
            <button
              onClick={handleAddProduct}
              className="bg-[#2563eb] hover:bg-blue-700 text-white p-1.5 rounded transition-colors shadow-sm"
              title="Add Product"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {products.map((product) => {
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
                            const newProducts = [...products];
                            const idx = newProducts.findIndex(p => p.id === product.id);
                            newProducts[idx].category = e.target.value;
                            setProducts(newProducts);
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
                              const newProducts = [...products];
                              const idx = newProducts.findIndex(p => p.id === product.id);
                              const val = e.target.value;
                              if (val) {
                                newProducts[idx].countdownHours = val;
                                newProducts[idx].endTime = Date.now() + parseInt(val) * 3600000;
                              } else {
                                delete newProducts[idx].countdownHours;
                                delete newProducts[idx].endTime;
                              }
                              setProducts(newProducts);
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
                            const newProducts = [...products];
                            const idx = newProducts.findIndex(p => p.id === product.id);
                            newProducts[idx].title = e.target.value;
                            setProducts(newProducts);
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
                            const newProducts = [...products];
                            const idx = newProducts.findIndex(p => p.id === product.id);
                            newProducts[idx].thumbnail = e.target.value;
                            setProducts(newProducts);
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
                              const newProducts = [...products];
                              const idx = newProducts.findIndex(p => p.id === product.id);
                              newProducts[idx].price = Number(e.target.value);
                              setProducts(newProducts);
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
                              const newProducts = [...products];
                              const idx = newProducts.findIndex(p => p.id === product.id);
                              newProducts[idx].validDays = Number(e.target.value);
                              setProducts(newProducts);
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
                              const newProducts = [...products];
                              const idx = newProducts.findIndex(p => p.id === product.id);
                              newProducts[idx].totalIncome = Number(e.target.value);
                              setProducts(newProducts);
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-[17px]">Play</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Cricket Matches Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${cricketExpanded ? "shadow-sm" : ""}`}
            >
              <div
                className={`flex justify-between items-center w-full p-4 ${cricketExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setCricketExpanded(!cricketExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Cricket
                  {cricketExpanded ? (
                    <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                  )}
                </button>
                {cricketExpanded && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
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
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors shadow-sm ml-4"
                      title="Add Match"
                    >
                      <Plus className="w-3 h-3" /> Add Match
                    </button>

                  </div>
                )}
              </div>

              {cricketExpanded && (
                <div className="p-4 space-y-4">
                  {cricketMatches.map((match: any, index: number) => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <input
                          className="border border-gray-300 rounded p-1 text-sm font-bold w-1/2"
                          value={match.title}
                          onChange={(e) => {
                            const n = [...cricketMatches];
                            n[index].title = e.target.value;
                            setCricketMatches(n);
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
                            const n = [...cricketMatches];
                            n[index].status = e.target.value;
                            setCricketMatches(n);
                            saveCricketMatches(n);
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

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold">
                            TEAM 1 (Short)
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded p-1.5 text-sm uppercase"
                            value={match.team1.short}
                            onChange={(e) => {
                              const n = [...cricketMatches];
                              n[index].team1.short = e.target.value;
                              n[index].team1.name = e.target.value;
                              setCricketMatches(n);
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
                              const n = [...cricketMatches];
                              n[index].team2.short = e.target.value;
                              n[index].team2.name = e.target.value;
                              setCricketMatches(n);
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
                              const n = [...cricketMatches];
                              n[index].team1.logoUrl = e.target.value;
                              setCricketMatches(n);
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
                              const n = [...cricketMatches];
                              n[index].team2.logoUrl = e.target.value;
                              setCricketMatches(n);
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
                              const n = [...cricketMatches];
                              n[index].time = e.target.value;
                              setCricketMatches(n);
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
                              const n = [...cricketMatches];
                              n[index].entryFee = Number(e.target.value);
                              setCricketMatches(n);
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
                      {match.status === "live" && (
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
                                const n = [...cricketMatches];
                                if (!n[index].liveDetails)
                                  n[index].liveDetails = {};
                                n[index].liveDetails.team1Score =
                                  e.target.value;
                                setCricketMatches(n);
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
                                const n = [...cricketMatches];
                                if (!n[index].liveDetails)
                                  n[index].liveDetails = {};
                                n[index].liveDetails.team2Score =
                                  e.target.value;
                                setCricketMatches(n);
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
                                const n = [...cricketMatches];
                                n[index].winningTeam = match.team1.short;
                                setCricketMatches(n);
                                saveCricketMatches(n);
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
                                const n = [...cricketMatches];
                                n[index].winningTeam = match.team2.short;
                                setCricketMatches(n);
                                saveCricketMatches(n);
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* eSports Tournaments Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${esportsExpanded ? "shadow-sm" : ""}`}
            >
              <div
                className={`flex justify-between items-center w-full p-4 ${esportsExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setEsportsExpanded(!esportsExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Match
                  {esportsExpanded ? (
                    <ChevronUp className="text-gray-500 w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="text-gray-500 w-5 h-5 ml-2" />
                  )}
                </button>
                {esportsExpanded && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const newTournament = {
                          id: Date.now(),
                          game: "Free Fire Max",
                          title: "New Match",
                          date: "2024-06-01",
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
                        window.dispatchEvent(new Event("admin_config_updated"));
                      }}
                      className="bg-[#8b5cf6] hover:bg-purple-600 text-white px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors shadow-sm ml-4"
                    >
                      <Plus className="w-3 h-3" /> Add Match
                    </button>

                  </div>
                )}
              </div>

              {esportsExpanded && (
                <div className="p-4 space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setEsportsTab('upcoming')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${esportsTab === 'upcoming' ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setEsportsTab('live')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${esportsTab === 'live' ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => setEsportsTab('result')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${esportsTab === 'result' ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Result
                    </button>
                    <button
                      onClick={() => setEsportsTab('ended')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md ${esportsTab === 'ended' ? 'bg-white shadow text-[#6D28D9]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Delete
                    </button>
                  </div>

                  {tournaments.filter((t: any) => {
                    if (esportsTab === 'upcoming') return t.status === 'upcoming';
                    if (esportsTab === 'live') return t.status === 'live';
                    if (esportsTab === 'result' || esportsTab === 'ended') return t.status === 'ended';
                    return true;
                  }).map((t: any) => {
                    const index = tournaments.findIndex((tr: any) => tr.id === t.id);
                    return (
                    <div
                      key={t.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative mb-3"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <select
                          className="border border-gray-300 rounded p-1 text-sm font-bold w-1/3"
                          value={t.game}
                          onChange={(e) => {
                            const n = [...tournaments];
                            n[index].game = e.target.value;
                            setTournaments(n);
                            saveMatchRooms(n);
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
                            const n = [...tournaments];
                            n[index].status = e.target.value;
                            setTournaments(n);
                            saveMatchRooms(n);
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

                      {esportsTab === "upcoming" && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            placeholder="Match Title"
                            value={t.title}
                            onChange={(e) => {
                              const n = [...tournaments];
                              n[index].title = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                          <select
                            className="border border-gray-200 p-1.5 text-xs rounded"
                            value={t.matchType}
                            onChange={(e) => {
                              const n = [...tournaments];
                              n[index].matchType = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
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
                              const n = [...tournaments];
                              n[index].date = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
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
                              const n = [...tournaments];
                              n[index].time = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                          <select
                            className="border border-gray-200 p-1.5 text-xs rounded bg-white text-gray-700 h-8"
                            value={t.map}
                            onChange={(e) => {
                              const n = [...tournaments];
                              n[index].map = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
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
                              const n = [...tournaments];
                              n[index].totalSlots = Number(e.target.value);
                              const E = n[index].entryFee || 0;
                              const N = n[index].totalSlots || 0;
                              if (E > 0 && N > 1) {
                                const T = E * N;
                                n[index].prizePool = Math.floor(T * 0.2);
                                n[index].perKill = Math.floor(
                                  (T * 0.3) / (N - 1),
                                );
                              }
                              setTournaments(n);
                              saveMatchRooms(n);
                              window.dispatchEvent(
                                new Event("admin_config_updated"),
                              );
                            }}
                          />
                        </div>
                      )}

                      {esportsTab === "upcoming" && (
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
                                const n = [...tournaments];
                                n[index].entryFee = Number(e.target.value);
                                const E = n[index].entryFee || 0;
                                const N = n[index].totalSlots || 0;
                                if (E > 0 && N > 1) {
                                  const T = E * N;
                                  n[index].prizePool = Math.floor(T * 0.2);
                                  n[index].perKill = Math.floor(
                                    (T * 0.3) / (N - 1),
                                  );
                                }
                                setTournaments(n);
                                saveMatchRooms(n);
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
                                const n = [...tournaments];
                                n[index].perKill = Number(e.target.value);
                                setTournaments(n);
                                saveMatchRooms(n);
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
                                const n = [...tournaments];
                                n[index].prizePool = Number(e.target.value);
                                setTournaments(n);
                                saveMatchRooms(n);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {(esportsTab === "upcoming" || esportsTab === "live" || esportsTab === "result") && (
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

                      {(esportsTab === "upcoming" || esportsTab === "live") && (
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
                                const n = [...tournaments];
                                if (!n[index].roomDetails)
                                  n[index].roomDetails = { id: "", password: "" };
                                n[index].roomDetails.id = e.target.value;
                                setTournaments(n);
                                saveMatchRooms(n);
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
                                const n = [...tournaments];
                                if (!n[index].roomDetails)
                                  n[index].roomDetails = { id: "", password: "" };
                                n[index].roomDetails.password = e.target.value;
                                setTournaments(n);
                                saveMatchRooms(n);
                                window.dispatchEvent(
                                  new Event("admin_config_updated"),
                                );
                              }}
                            />
                          </div>
                          <input
                            className="w-full border border-blue-200 rounded p-1 text-xs"
                            placeholder="Live Stream URL (optional)"
                            value={t.streamLink || ""}
                            onChange={(e) => {
                              const n = [...tournaments];
                              n[index].streamLink = e.target.value;
                              setTournaments(n);
                              saveMatchRooms(n);
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
                                        id={`kills_input_${t.id}_${u.uid}`}
                                        className="w-12 border border-gray-200 rounded p-1 text-xs text-center"
                                        placeholder="Kills"
                                        defaultValue={existingResult.kills}
                                      />
                                      <label className="flex items-center gap-1 text-[10px] whitespace-nowrap bg-gray-50 p-1 border border-gray-200 rounded cursor-pointer">
                                        <input type="checkbox" id={`won_input_${t.id}_${u.uid}`} defaultChecked={existingResult.isWinner} />
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
                              
                              const n = [...tournaments];
                              if (!n[index].results) n[index].results = [];
                              
                              let totalDistributed = 0;
                              
                              for (const u of players) {
                                const existingResult = n[index].results.find((r: any) => r.uid === u.uid);
                                if (existingResult?.distributed) continue;
                                
                                const killsInput = document.getElementById(`kills_input_${t.id}_${u.uid}`) as HTMLInputElement;
                                const wonInput = document.getElementById(`won_input_${t.id}_${u.uid}`) as HTMLInputElement;
                                
                                if (killsInput) {
                                  const kills = Number(killsInput.value) || 0;
                                  const isWinner = wonInput?.checked || false;
                                  
                                  const reward = (kills * t.perKill) + (isWinner ? t.prizePool : 0);
                                  
                                  if (reward >= 0) {
                                    // Make sure we have save operation
                                    const { update, ref } = require("firebase/database");
                                    const { rtdb } = require("../firebase");
                                    // Distribute coins in db
                                    if (reward > 0) {
                                       await update(ref(rtdb, `users/${u.uid}`), {
                                         coins: (u.coins || 0) + reward
                                       });
                                    }
                                    
                                    const resultData = {
                                      uid: u.uid,
                                      playerName: u.tournamentDetails?.[t.id]?.inGameName || "Player",
                                      kills,
                                      isWinner,
                                      reward,
                                      distributed: true
                                    };
                                    
                                    if (existingResult) {
                                      Object.assign(existingResult, resultData);
                                    } else {
                                      n[index].results.push(resultData);
                                    }
                                    totalDistributed += reward;
                                  }
                                }
                              }
                              
                              setTournaments(n);
                              saveMatchRooms(n);
                              window.dispatchEvent(new Event("admin_config_updated"));
                              alert(`Successfully distributed total ${totalDistributed} coins to players!`);
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

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-3">
                        <span className="text-xs text-gray-500"></span>
                        <button
                          onClick={() => {
                            const n = tournaments.filter((_, i) => i !== index);
                            setTournaments(n);
                            saveMatchRooms(n);
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                          className="text-red-500 hover:bg-red-50 px-3 py-1.5 font-bold text-xs rounded border border-red-200"
                        >
                          <Trash2 className="w-4 h-4 inline-block mr-1" /> Delete Match
                        </button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* Quiz Settings Accordion */}
            <div
              className={`border border-gray-200 rounded-lg ${quizExpanded ? "shadow-sm" : ""}`}
            >
              <div
                className={`flex justify-between items-center w-full p-4 ${quizExpanded ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                <button
                  onClick={() => setQuizExpanded(!quizExpanded)}
                  className="flex-1 flex justify-between items-center font-bold text-[#374151] text-[15px]"
                >
                  Quiz
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
                          className="bg-white border text-sm border-gray-200 rounded p-2 shadow-sm relative pt-4"
                        >
                          <span className="absolute top-1 left-2 text-[10px] font-bold text-gray-400">
                            Q{qIndex + 1}
                          </span>
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
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
                      <div key={task.id} className="border border-gray-200 p-3 rounded-lg bg-gray-50 flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{task.title}</span>
                         </div>
                         <div>
                            <label className="text-[11px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">URL</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={task.url}
                              onChange={(e) => {
                                 const n = [...earnTasks];
                                 n[index].url = e.target.value;
                                 setEarnTasks(n);
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
                                 const n = [...earnTasks];
                                 n[index].coins = Number(e.target.value);
                                 setEarnTasks(n);
                              }}
                              onBlur={() => {
                                 saveEarnTasks(earnTasks);
                              }}
                            />
                         </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
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
                      {[1, 2, 3].map((slide) => (
                        <div
                          key={slide}
                          className="border border-gray-200 rounded-lg p-3 space-y-3 relative pt-4 bg-gray-50"
                        >
                          <p className="text-[11px] font-bold text-[#4b5563] bg-white border border-gray-200 px-1.5 absolute -top-2 left-3 rounded">
                            Slide #{slide}
                          </p>
                          <input
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            defaultValue="https://uploads.onecompiler.io/43b6sbecd/..."
                            placeholder="Image URL"
                          />
                          <input
                            className="w-full border border-gray-200 rounded p-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            defaultValue={
                              slide === 3
                                ? "https://youtu.be/F1BTfxYQwhI"
                                : "https://uploads.onecompiler.io/43b6secd/..."
                            }
                            placeholder="Target URL (e.g., YouTube or Telegram)"
                          />
                        </div>
                      ))}
                    </div>
                    <button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2.5 rounded text-[15px] mt-4 transition-colors shadow-sm">
                      Update Banners
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-[17px]">General</h2>
          </div>
          <div className="p-4 space-y-4">
            <div
              className={`border border-gray-200 rounded-lg ${uiExpanded ? "shadow-sm" : ""}`}
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
                      defaultValue="https://example.com/qr.png"
                    />
                    <button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2.5 rounded text-[15px] mt-3 transition-colors shadow-sm">
                      Update QR
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""}`}
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
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-[15px] text-[#1f2937] leading-tight mb-0.5">
                              {user.bankDetails?.mobileNumber || user.email || `Player ${user.uid.slice(0,5)}`}
                            </p>
                            <p className="text-gray-400 text-[13px] mb-0.5" title={user.uid}>
                              UID: {user.uid.slice(0, 8)}...
                            </p>
                          </div>
                          <button onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this user?")) {
                              await update(ref(rtdb), {
                                [`users/${user.uid}`]: null
                              });
                              alert("User deleted!");
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
