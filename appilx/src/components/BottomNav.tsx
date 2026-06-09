import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, TrendingUp, Trophy, Share2, User } from 'lucide-react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setScreen }) => {
  const tabs = [
    { id: 'HOME' as ScreenType, icon: Home, label: 'Home' },
    { id: 'INVEST' as ScreenType, icon: TrendingUp, label: 'Invest' },
    { id: 'WINNER' as any, icon: Trophy, label: 'Wins', center: true },
    { id: 'PROMOTION' as ScreenType, icon: Share2, label: 'Earn' },
    { id: 'PROFILE' as ScreenType, icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 h-16 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-between px-4 z-50 border border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;

        if (tab.center) {
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              className="relative -top-10 w-16 h-16 bg-purple-600 rounded-full shadow-lg shadow-purple-200 flex items-center justify-center text-white border-4 border-white"
              onClick={() => {}} // Could lead to a leaderboard modal
            >
              <Icon size={28} />
            </motion.button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
              isActive ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
