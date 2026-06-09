import React from 'react';
import { motion } from 'motion/react';
import { PlusCircle, ArrowDownCircle, Bell, ChevronRight, TrendingUp } from 'lucide-react';
import { ScreenType } from '../../types';
import { TOP_WINNERS } from '../../constants';

interface HomeProps {
  setScreen: (screen: ScreenType) => void;
}

export const HomeScreen: React.FC<HomeProps> = ({ setScreen }) => {
  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-purple-600 h-64 rounded-b-[40px] p-8 text-white relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-purple-200 text-sm font-medium">Welcome back,</p>
            <h2 className="text-2xl font-bold">Yogesh Prajapat</h2>
          </div>
          <button className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Bell size={20} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-purple-600/20 text-gray-900 border border-purple-50 translate-y-1/4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Assets</p>
              <h1 className="text-4xl font-black">₹139.00</h1>
            </div>
            <div className="bg-green-100 text-green-600 p-2 rounded-full">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setScreen('RECHARGE')}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white h-12 rounded-2xl font-bold shadow-md shadow-purple-100 transition-transform active:scale-95"
            >
              <PlusCircle size={18} />
              <span>Recharge</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-900 h-12 rounded-2xl font-bold transition-transform active:scale-95">
              <ArrowDownCircle size={18} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-24 px-6 space-y-6">
        {/* Special Offers Banner */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-900">Special Offers</h3>
            <button className="text-purple-600 text-xs font-bold flex items-center">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="relative h-44 rounded-[32px] overflow-hidden shadow-lg shadow-purple-100">
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" 
              className="w-full h-full object-cover"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <h4 className="text-white font-bold text-xl leading-tight">Battle Pro Tournament</h4>
              <p className="text-purple-200 text-xs font-medium mt-1">Join Free Fire & Earn Rewards</p>
            </div>
          </div>
        </div>

        {/* Top Winners List */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-4">Top Winners</h3>
          <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-100">
            {TOP_WINNERS.map((winner, idx) => (
              <div 
                key={idx} 
                className={`p-4 flex items-center justify-between ${idx !== TOP_WINNERS.length - 1 ? 'border-bottom border-gray-50' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                    {winner.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-900">{winner.name}</h5>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{winner.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-bold text-sm">+{winner.amount}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Withdrawn</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
