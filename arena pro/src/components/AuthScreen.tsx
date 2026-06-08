import React, { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { auth, rtdb } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';

interface AuthProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Admin override check just in case, but regular flow works since we append @clorigo.com
    const emailToUse = email.includes('@') ? email : `${email}@clorigo.com`; 

    setLoading(true);
    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, emailToUse, password);
        } catch (signInErr: any) {
             const userCred = await createUserWithEmailAndPassword(auth, emailToUse, password);
             await update(ref(rtdb, `users/${userCred.user.uid}`), {
               displayName: fullName || emailToUse,
             });
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, emailToUse, password);
        const updates: any = {
           displayName: fullName || emailToUse,
        };
        if (referralCode) {
           updates.referredBy = referralCode;
        }
        await update(ref(rtdb, `users/${userCred.user.uid}`), updates);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center px-6 pt-32 pb-10 font-sans">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">
          <span className="text-white text-[28px] font-bold tracking-wide">Arena Pro</span>
        </div>
        <p className="text-gray-500 text-sm">Your Ultimate Gaming App</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
        <div className="space-y-4">
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] transition-colors"
            />
          )}
          
          <input 
            type="text" 
            placeholder="Enter Number" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] transition-colors"
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] transition-colors"
          />

          {!isLogin && (
            <input 
              type="text" 
              placeholder="Referral Code (optional)"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] transition-colors"
            />
          )}

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            {!loading && isLogin && <ArrowRight className="w-4 h-4 ml-1" strokeWidth={3} />}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <div className="mx-4 text-gray-400 text-sm font-medium">OR</div>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>

      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="flex items-center justify-center gap-1.5 text-[#6D28D9] font-bold text-[15px]"
      >
        {isLogin ? (
          <>
            <Plus className="w-4 h-4" strokeWidth={4} />
            Don't have an account?
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4" strokeWidth={3} />
            Already have an account?
          </>
        )}
      </button>
    </div>
  );
};
