import React, { useState } from 'react';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  User,
  Phone,
  Lock,
  Gift,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { auth, rtdb } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { emailForNumber, friendlyAuthError } from '../utils/authErrors';

interface SignUpScreenProps {
  onBack: () => void;
  onSignedUp: () => void;
}

const inputBase =
  'w-full bg-white border text-gray-800 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-1 transition-colors placeholder:text-gray-400';
const inputIdle = 'border-gray-200 focus:border-[#6D28D9] focus:ring-[#6D28D9]';
const inputBad = 'border-red-300 focus:border-red-400 focus:ring-red-400';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onSignedUp }) => {
  const [fullName, setFullName] = useState('');
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Mirrors what the submit button validates, so the fields can show it inline.
  const problems = {
    fullName: fullName.trim().length < 2 ? 'Enter your name' : '',
    number: number.trim().length < 6 ? 'Enter your mobile number' : '',
    password: password.length < 6 ? 'At least 6 characters' : '',
  };
  const isValid = !problems.fullName && !problems.number && !problems.password;

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async () => {
    setError('');
    setTouched({ fullName: true, number: true, password: true });
    if (!isValid) return;

    setLoading(true);
    try {
      const email = emailForNumber(number);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const record: Record<string, unknown> = {
        displayName: fullName.trim(),
        email,
        phone: number.trim(),
        // Their own shareable code. The Promotion screen falls back to this same
        // value, so generating it here keeps the two in step.
        referralCode: uid.slice(0, 8).toUpperCase(),
        coins: 0,
        balance: 0,
        createdAt: Date.now(),
      };
      if (referralCode.trim()) {
        record.referredBy = referralCode.trim().toUpperCase();
      }

      await update(ref(rtdb, `users/${uid}`), record);

      // Resolve the friend's code and record the link on their node, so their
      // Sales screen can read it without access to the users collection.
      if (record.referredBy) {
        try {
          const codeSnap = await get(ref(rtdb, `referralIndex/${record.referredBy}`));
          const referrerUid = codeSnap.val();
          if (referrerUid && referrerUid !== uid) {
            await update(ref(rtdb, `referrals/${referrerUid}/${uid}`), {
              uid,
              displayName: fullName.trim(),
              joinedAt: Date.now(),
            });
          }
        } catch (linkError) {
          // A missing referral link must not fail the sign-up itself.
          console.error("Could not record referral", linkError);
        }
      }

      onSignedUp();
    } catch (err: any) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: keyof typeof problems) =>
    `${inputBase} ${touched[field] && problems[field] ? inputBad : inputIdle}`;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col px-6 pt-8 pb-10 font-sans">
      {/* Back to login */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#6D28D9] font-bold text-[14px] self-start -ml-1 p-1"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        Back to login
      </button>

      <div className="flex flex-col items-center mt-6 mb-8 text-center">
        <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">
          <span className="text-white text-[26px] font-bold tracking-wide">Arena Pro</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#14122C]">Create your account</h1>
        <p className="text-gray-500 text-sm mt-1">Join, play and win coins</p>
      </div>

      <div className="w-full max-w-sm mx-auto bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl p-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5 ml-1">FULL NAME</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => markTouched('fullName')}
                placeholder="Your name"
                autoComplete="name"
                className={fieldClass('fullName')}
              />
            </div>
            {touched.fullName && problems.fullName && (
              <p className="text-red-500 text-[11px] mt-1 ml-1">{problems.fullName}</p>
            )}
          </div>

          {/* Number */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5 ml-1">MOBILE NUMBER</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                inputMode="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={() => markTouched('number')}
                placeholder="e.g. 9876543210"
                autoComplete="tel"
                className={fieldClass('number')}
              />
            </div>
            {touched.number && problems.number && (
              <p className="text-red-500 text-[11px] mt-1 ml-1">{problems.number}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5 ml-1">PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className={`${fieldClass('password')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && problems.password && (
              <p className="text-red-500 text-[11px] mt-1 ml-1">{problems.password}</p>
            )}
          </div>

          {/* Referral */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1.5 ml-1">
              REFERRAL CODE <span className="text-gray-300 font-medium">(optional)</span>
            </label>
            <div className="relative">
              <Gift className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Friend's code"
                autoCapitalize="characters"
                className={`${inputBase} ${inputIdle} tracking-widest`}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" strokeWidth={3} />
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed pt-1">
            By creating an account you agree to play fair and follow the match rules.
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="mt-6 self-center text-[#6D28D9] font-bold text-[15px]"
      >
        Already have an account? Log in
      </button>
    </div>
  );
};

export default SignUpScreen;
