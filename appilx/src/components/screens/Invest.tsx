import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Clock, Wallet, ShieldCheck } from 'lucide-react';
import { PRODUCTS } from '../../constants';

export const InvestScreen: React.FC = () => {
  const [tab, setTab] = useState<'DAILY' | 'WELFARE'>('DAILY');

  return (
    <div className="pb-32 bg-gray-50 min-h-screen p-6 pt-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Choose Your Plan</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Smart investments for smart digital life</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <button 
          onClick={() => setTab('DAILY')}
          className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
            tab === 'DAILY' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-gray-400'
          }`}
        >
          Daily Plan
        </button>
        <button 
          onClick={() => setTab('WELFARE')}
          className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
            tab === 'WELFARE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-gray-400'
          }`}
        >
          Welfare Plan
        </button>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="wait">
          {PRODUCTS.filter(p => p.category === tab).map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col p-2"
            >
              <div className="relative h-40 rounded-[28px] overflow-hidden mb-4">
                <img 
                  src={product.image} 
                  className="w-full h-full object-cover"
                  alt={product.name}
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-purple-600 uppercase tracking-widest shadow-sm">
                  {tab} PLAN
                </div>
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-lg font-black text-gray-900 mb-4">{product.name}</h3>
                
                <div className="grid grid-cols-2 gap-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Daily</p>
                      <p className="text-sm font-bold text-gray-900">₹{product.dailyIncome}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Days</p>
                      <p className="text-sm font-bold text-gray-900">{product.validity} Days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Price</p>
                      <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                      <p className="text-sm font-bold text-gray-900">₹{product.totalIncome}</p>
                    </div>
                  </div>
                </div>

                <button className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] hover:bg-gray-800">
                  Invest Now
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
