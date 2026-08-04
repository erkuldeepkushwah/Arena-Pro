import React, { useState, useEffect } from "react";
import { ChevronLeft, Edit2 } from "lucide-react";
import { useUserProfile } from "../hooks/useFirebaseData";
import { saveBankDetails } from "../gameplayConfig";
import { ref, push, update, serverTimestamp } from "firebase/database";
import { auth, rtdb } from "../firebase";

interface WithdrawScreenProps {
  onBack: () => void;
}

export const WithdrawScreen: React.FC<WithdrawScreenProps> = ({ onBack }) => {
  const profile = useUserProfile();
  const bankDetailsFromProfile =
    profile?.bankDetails && profile.bankDetails.name
      ? profile.bankDetails
      : null;
  const [bankDetails, setBankDetails] = useState<{
    name: string;
    ac: string;
    ifsc: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", ac: "", ifsc: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!auth.currentUser) return;
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 180) {
      alert("Minimum withdrawal amount is ₹180");
      return;
    }
    const currentBalance = Number(profile?.balance || 0);
    if (withdrawAmount > currentBalance) {
      alert("Insufficient balance!");
      return;
    }

    try {
      setIsSubmitting(true);
      const userRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        balance: currentBalance - withdrawAmount,
      });

      const requestRef = push(ref(rtdb, "withdrawalRequests"));
      await update(requestRef, {
        uid: auth.currentUser.uid,
        amount: withdrawAmount,
        bankDetails: bankDetails,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      alert("Withdrawal request submitted successfully!");
      setAmount("");
      onBack();
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Failed to process withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (profile !== null) {
      if (bankDetailsFromProfile) {
        setBankDetails(bankDetailsFromProfile);
        setFormData(bankDetailsFromProfile);
      } else {
        setIsEditing(true);
      }
      setIsLoading(false);
    }
  }, [profile, bankDetailsFromProfile]);

  const handleSaveBankDetails = async () => {
    if (!formData.name || !formData.ac || !formData.ifsc) {
      alert("Please fill all bank details");
      return;
    }
    await saveBankDetails(formData);
    setBankDetails(formData);
    setIsEditing(false);
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <div className="bg-[#f8f9fa] px-4 py-3 flex items-center justify-center relative shadow-sm z-10 border-b border-gray-100">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 -ml-2 text-white"
        >
          <ChevronLeft className="w-6 h-6 text-gray-300" strokeWidth={2.5} />
        </button>
        <h1
          className="text-[19px] font-bold text-[#f0f0f0] tracking-wide text-center w-full"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          Withdraw
        </h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {!bankDetails || isEditing ? (
          <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50 space-y-4">
            <h2 className="text-[#1f2937] font-bold mb-2">
              Bank Account Details
            </h2>
            <div>
              <label className="text-[13px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-[15px] focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="text-[13px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                Account Number
              </label>
              <input
                type="text"
                value={formData.ac}
                onChange={(e) =>
                  setFormData({ ...formData, ac: e.target.value })
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-[15px] focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]"
                placeholder="Enter account no."
              />
            </div>
            <div>
              <label className="text-[13px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) =>
                  setFormData({ ...formData, ifsc: e.target.value })
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-[15px] focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] uppercase"
                placeholder="Enter IFSC code"
              />
            </div>
            <button
              onClick={handleSaveBankDetails}
              className="w-full bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl shadow-sm text-[16px] mt-2"
            >
              Save Bank Details
            </button>
            {bankDetails && isEditing && (
              <button
                onClick={() => {
                  setFormData(bankDetails);
                  setIsEditing(false);
                }}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl shadow-sm text-[15px] mt-2"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Account Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-[13px] mb-1">
                      Account Holder
                    </p>
                    <p className="text-[#1f2937] font-semibold text-[16px]">
                      {bankDetails.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[13px] mb-1">
                      Account Number
                    </p>
                    <p className="text-[#1f2937] font-semibold text-[16px]">
                      {bankDetails.ac}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[13px] mb-1">IFSC Code</p>
                    <p className="text-[#1f2937] font-semibold text-[16px] uppercase">
                      {bankDetails.ifsc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                  title="Edit Details"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Withdrawal Amount (Min ₹180)"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-800 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] mb-5 shadow-sm"
              />

              <div className="text-center mb-5">
                <p className="text-[#374151] font-semibold text-[15px] mb-1">
                  Available Balance: ₹{profile?.balance?.toFixed(2) || "0.00"}
                </p>
              </div>

              <button 
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="w-full bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl shadow-sm text-[16px] disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? "Processing..." : "Submit Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
