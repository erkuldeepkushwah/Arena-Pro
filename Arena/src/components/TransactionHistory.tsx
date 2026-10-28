import React, { useMemo } from "react";
import {
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Trophy,
  Gift,
  Gamepad2,
  Wallet,
  Receipt,
} from "lucide-react";
import { useTransactions } from "../hooks/useFirebaseData";
import { TX_META, TxType } from "../utils/transactions";

interface TransactionHistoryProps {
  onBack: () => void;
}

const ICONS: Record<TxType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  deposit: ArrowDownLeft,
  withdraw: ArrowUpRight,
  "game-entry": Gamepad2,
  winnings: Trophy,
  prize: Trophy,
  task: Gift,
  refund: Wallet,
};

const formatDate = (ms: number) => {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onBack }) => {
  const transactions = useTransactions();

  const { rows, credited, debited } = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => (b.date || 0) - (a.date || 0));
    let credited = 0;
    let debited = 0;
    sorted.forEach((t) => {
      const credits = TX_META[t.type]?.credits ?? true;
      if (t.status === "completed") {
        if (credits) credited += Number(t.amount) || 0;
        else debited += Number(t.amount) || 0;
      }
    });
    return { rows: sorted, credited, debited };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#f8f9fe] pb-10">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-[#311A89]" aria-label="Back">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold text-[#14122C]">Transaction History</h1>
      </div>

      {/* Summary */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Money in</p>
            <p className="text-[20px] font-bold text-[#16a34a] mt-1">₹{credited.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Money out</p>
            <p className="text-[20px] font-bold text-[#dc2626] mt-1">₹{debited.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <Receipt className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-[15px] font-medium">No transactions yet</p>
            <p className="text-gray-400 text-[12px] text-center px-8">
              Wallet top-ups, match entries, winnings and withdrawals all show up here.
            </p>
          </div>
        ) : (
          rows.map((t) => {
            const meta = TX_META[t.type] ?? { label: t.type, credits: true };
            const Icon = ICONS[t.type] ?? Receipt;
            const credits = meta.credits;
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    credits ? "bg-green-50 text-[#16a34a]" : "bg-red-50 text-[#dc2626]"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1f2937] text-[14px] leading-tight truncate">
                    {meta.label}
                  </p>
                  <p className="text-gray-400 text-[12px] truncate">{t.description}</p>
                  <p className="text-gray-300 text-[11px] mt-0.5">{formatDate(t.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-bold text-[15px] ${
                      credits ? "text-[#16a34a]" : "text-[#dc2626]"
                    }`}
                  >
                    {credits ? "+" : "−"}₹{Number(t.amount).toFixed(2)}
                  </p>
                  {t.status !== "completed" && (
                    <span className="text-[10px] font-bold uppercase text-yellow-600">
                      {t.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
