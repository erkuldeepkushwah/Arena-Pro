import React, { useState } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { rtdb, auth } from '../firebase';
import { ref, get, update, increment, runTransaction } from 'firebase/database';

interface RedeemCodeProps {
  onBack: () => void;
}

type Msg = { type: 'success' | 'error'; text: string } | null;

/** Firebase keys cannot contain . # $ / [ ] */
const toKey = (code: string) => code.replace(/[.#$/\[\]]/g, '_');

export const RedeemCode: React.FC<RedeemCodeProps> = ({ onBack }) => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<Msg>(null);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    const entered = code.trim().toUpperCase();
    setMessage(null);

    if (!entered) {
      setMessage({ type: 'error', text: 'Enter a code first.' });
      return;
    }
    if (!auth.currentUser) {
      setMessage({ type: 'error', text: 'Please log in again.' });
      return;
    }

    setLoading(true);
    const uid = auth.currentUser.uid;
    try {
      // The admin sets the live code and its reward in the dashboard; both live
      // under global/siteConfig. Nothing used to read them, so this screen was
      // a dead form with an input that had no state and a button with no handler.
      const cfgSnap = await get(ref(rtdb, 'global/siteConfig'));
      const cfg = cfgSnap.val() || {};
      const activeCode = String(cfg.redeemCode || '').trim().toUpperCase();
      const reward = Number(cfg.redeemAmount) || 0;

      if (!activeCode) {
        setMessage({ type: 'error', text: 'No redeem code is active right now.' });
        return;
      }
      if (entered !== activeCode) {
        setMessage({ type: 'error', text: 'That code is not valid.' });
        return;
      }
      if (reward <= 0) {
        setMessage({ type: 'error', text: 'This code has no reward set.' });
        return;
      }

      // One redemption per user per code. The transaction only commits if the
      // flag is still absent, so two taps (or two tabs) can't both pay out.
      const flagRef = ref(rtdb, `users/${uid}/redeemedCodes/${toKey(entered)}`);
      const claim = await runTransaction(flagRef, (existing) => (existing ? undefined : true));
      if (!claim.committed) {
        setMessage({ type: 'error', text: 'You have already redeemed this code.' });
        return;
      }

      await update(ref(rtdb, `users/${uid}`), { coins: increment(reward) });
      // Once the transaction ledger (PR #2) is merged, add a logTransaction()
      // call here so redemptions show up in the history screen too.

      setMessage({ type: 'success', text: `${reward} coins added to your wallet!` });
      setCode('');
    } catch (error) {
      console.error('Redeem failed', error);
      setMessage({ type: 'error', text: 'Could not redeem right now. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      {/* Header — the title used to be #f0f0f0 on a #f8f9fa background, i.e. invisible. */}
      <div className="bg-white px-4 py-3 flex items-center justify-center relative border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="absolute left-4 p-2 -ml-2 text-[#1e3a8a]" aria-label="Back">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-bold text-[#1f2937] tracking-wide text-center w-full">
          Redeem Code
        </h1>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
          <h2 className="text-[#374151] font-bold text-[16px] mb-4">Enter Redeem Code</h2>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (message) setMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRedeem();
            }}
            placeholder="ENTER CODE HERE"
            autoCapitalize="characters"
            className="w-full bg-[#f8f9fa] border border-gray-100 rounded-xl py-3.5 px-4 text-center text-[#1f2937] font-bold tracking-widest placeholder:font-medium placeholder:tracking-wide placeholder:text-gray-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] mb-4"
          />

          <button
            onClick={handleRedeem}
            disabled={loading}
            className="w-full bg-[#2563eb] text-white font-bold py-3.5 rounded-xl shadow-sm text-[16px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Checking…' : 'Get Balance'}
          </button>

          {message && (
            <div
              role="status"
              className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-[13px] font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
