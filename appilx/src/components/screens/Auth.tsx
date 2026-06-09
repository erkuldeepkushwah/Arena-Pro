import React from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { ScreenType } from '../../types';

interface AuthProps {
  setScreen: (screen: ScreenType) => void;
  isLogin: boolean;
}

export const AuthScreen: React.FC<AuthProps> = ({ setScreen, isLogin }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-8 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12"
      >
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-purple-200 mb-4">
          A
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Applix</h1>
        <p className="text-gray-500 text-sm mt-1">Your Partner in Digital Transformation</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        {!isLogin && (
          <div className="relative group">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Full Name"
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium"
            />
          </div>
        )}
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
          <input 
            type="email" 
            placeholder="Email Address"
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium"
          />
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium"
          />
        </div>

        <button 
          onClick={() => setScreen('HOME')}
          className="w-full h-14 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all"
        >
          <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          <ArrowRight size={20} />
        </button>

        <div className="text-center mt-6">
          <button 
            onClick={() => setScreen(isLogin ? 'REGISTER' : 'LOGIN')}
            className="text-gray-500 font-medium"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-purple-600">Register</span></>
            ) : (
              <>Already have an account? <span className="text-purple-600">Login</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
