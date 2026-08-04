import React from "react";
import { ChevronLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useWithdrawalRequests } from "../hooks/useFirebaseData";
import { auth } from "../firebase";

interface WithdrawRecordScreenProps {
  onBack: () => void;
}

export const WithdrawRecordScreen: React.FC<WithdrawRecordScreenProps> = ({ onBack }) => {
  const requests = useWithdrawalRequests();
  const myRequests = requests.filter((r) => r.uid === auth.currentUser?.uid);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <div className="bg-[#f8f9fa] px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 -ml-2 text-white"
        >
          <ChevronLeft className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
        </button>
        <h1
          className="text-[19px] font-bold text-[#111] tracking-wide text-center w-full"
        >
          Withdrawal Record
        </h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {myRequests.length > 0 ? (
          myRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-[16px] text-[#111]">₹{req.amount}</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  {new Date(req.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                {req.status === "pending" && (
                  <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-[12px] font-bold">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
                {req.status === "approved" && (
                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-[12px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                )}
                {req.status === "rejected" && (
                  <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-[12px] font-bold">
                    <XCircle className="w-3 h-3" /> Rejected
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No withdrawal records found.
          </div>
        )}
      </div>
    </div>
  );
};
