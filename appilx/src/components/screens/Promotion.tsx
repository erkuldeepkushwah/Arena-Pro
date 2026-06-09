import React from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Users, Wallet, ChevronRight, Award, LogOut } from 'lucide-react';
import { ScreenType } from '../../types';

interface PromotionProps {
  isProfile?: boolean;
  setScreen: (screen: ScreenType) => void;
}

export const PromotionScreen: React.FC<PromotionProps> = ({ isProfile, setScreen }) => {
  const referralCode = "MB9SX91H";

  if (isProfile) {
    return (
      <div className="pb-32 bg-gray-50 min-h-screen">
        <div className="p-8 pt-16 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-purple-100 border-4 border-white shadow-xl flex items-center justify-center text-purple-600 text-3xl font-black mb-4">
            YP
          </div>
          <h2 className="text-xl font-black text-gray-900">Yogesh Prajapat</h2>
          <p className="text-gray-400 font-medium text-sm">+91 9876543210</p>
        </div>

        <div className="px-6 space-y-3">
          {[
            { icon: Wallet, label: 'Withdrawal Records', color: 'bg-blue-50 text-blue-600' },
            { icon: Users, label: 'My Referral Team', color: 'bg-green-50 text-green-600' },
            { icon: Award, label: 'Promotion Rewards', action: () => setScreen('PROMOTION'), color: 'bg-purple-50 text-purple-600' },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.action}
              className="w-full h-16 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-gray-900">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
          
          <button 
            onClick={() => setScreen('LOGIN')}
            className="w-full h-16 bg-red-50 text-red-600 rounded-2xl p-4 flex items-center justify-center space-x-2 mt-6 active:scale-[0.99] transition-transform"
          >
            <LogOut size={20} />
            <span className="font-black uppercase tracking-widest text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-gray-50 min-h-screen p-6 pt-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Invite & Earn</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Get rewarded for growing the Applix family</p>
      </div>

      <div className="bg-white rounded-[32px] p-8 text-center shadow-lg shadow-purple-50 border border-gray-50 mb-8">
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-200">
          <Share2 size={28} />
        </div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Your Referral Code</p>
        <div className="bg-gray-50 w-full rounded-2xl p-4 border border-dashed border-purple-200 flex items-center justify-between mb-6">
          <span className="text-xl font-black tracking-widest text-purple-600">{referralCode}</span>
          <button className="text-purple-600 bg-white p-2 rounded-xl shadow-sm hover:bg-purple-50 transition-colors">
            <Copy size={18} />
          </button>
        </div>
        <button className="w-full h-14 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-100 active:scale-[0.98] transition-transform">
          Invite Friends
        </button>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6">Reward Progress</h3>
        <div className="space-y-6">
          {[
            { label: 'Bronze Partner', target: '5 Invites', progress: 80, reward: '₹500' },
            { label: 'Silver Partner', target: '20 Invites', progress: 30, reward: '₹2500' },
          ].map((tier, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-black text-sm text-gray-900">{tier.label}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Goal: {tier.target}</p>
                </div>
                <span className="text-purple-600 font-black text-xs">Unlock {tier.reward}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.progress}%` }}
                  className="h-full bg-purple-600 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
