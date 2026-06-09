import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenType } from './types';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/screens/Auth';
import { HomeScreen } from './components/screens/Home';
import { InvestScreen } from './components/screens/Invest';
import { PromotionScreen } from './components/screens/Promotion';
import { PaymentScreen } from './components/screens/Payment';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('LOGIN');
  const [paymentStep, setPaymentStep] = useState<'AMOUNT' | 'COMPLETE'>('AMOUNT');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return <AuthScreen key="login" isLogin={true} setScreen={setCurrentScreen} />;
      case 'REGISTER':
        return <AuthScreen key="register" isLogin={false} setScreen={setCurrentScreen} />;
      case 'HOME':
        return <HomeScreen key="home" setScreen={setCurrentScreen} />;
      case 'INVEST':
        return <InvestScreen key="invest" />;
      case 'PROMOTION':
        return <PromotionScreen key="promo" setScreen={setCurrentScreen} />;
      case 'PROFILE':
        return <PromotionScreen key="profile" isProfile={true} setScreen={setCurrentScreen} />;
      case 'RECHARGE':
      case 'PAYMENT':
        return (
          <PaymentScreen 
            key="payment" 
            step={paymentStep} 
            setScreen={setCurrentScreen} 
            setPaymentStep={setPaymentStep} 
          />
        );
      default:
        return <HomeScreen key="default" setScreen={setCurrentScreen} />;
    }
  };

  const showNav = ['HOME', 'INVEST', 'PROMOTION', 'PROFILE'].includes(currentScreen);

  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-white shadow-2xl relative overflow-x-hidden font-sans no-scrollbar">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen + (currentScreen === 'RECHARGE' ? paymentStep : '')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {showNav && (
        <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} />
      )}
    </div>
  );
}
