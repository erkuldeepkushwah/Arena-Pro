import React from 'react';
import { ChevronLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useRechargeRequests } from '../hooks/useFirebaseData';
import { auth } from '../firebase';

interface RechargeRecordProps {
  onBack: () => void;
}

export const RechargeRecord: React.FC<RechargeRecordProps> = ({ onBack }) => {
  const requests = useRechargeRequests();
  const myRequests = requests.filter((r) => r.uid === auth.currentUser?.uid);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <div className="bg-[#f8f9fa] px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button onClick={onBack} className="absolute left-4 p-2 -ml-2 text-white">
          <ChevronLeft className="w-6 h-6 text-gray-300" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-[#111] tracking-wide text-center w-full">
          Recharge Record
        </h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {myRequests.length > 0 ? (
          myRequests.map((record) => (
            <div key={record.id} className="bg-white rounded-xl p-5 flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
              <div>
                <p className="text-[#1f2937] font-bold text-[18px] mb-1 leading-tight">₹{record.amount}</p>
                <p className="text-gray-400 text-[13px]">
                  {new Date(record.timestamp).toLocaleString()}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide flex items-center justify-center gap-1 ${
                record.status === 'approved' ? 'bg-[#dcfce7] text-[#16a34a]' :
                record.status === 'rejected' ? 'bg-[#fee2e2] text-[#dc2626]' :
                'bg-[#fef9c3] text-[#ca8a04]'
              }`}>
                {record.status === "pending" && <Clock className="w-3 h-3" />}
                {record.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                {record.status === "rejected" && <XCircle className="w-3 h-3" />}
                <span className="capitalize">{record.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No recharge records found.
          </div>
        )}
      </div>
    </div>
  );
};
