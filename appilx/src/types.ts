export type ScreenType = 'LOGIN' | 'REGISTER' | 'HOME' | 'INVEST' | 'PROMOTION' | 'PROFILE' | 'RECHARGE' | 'PAYMENT';

export interface Product {
  id: string;
  name: string;
  price: number;
  dailyIncome: number;
  totalIncome: number;
  validity: number;
  category: 'DAILY' | 'WELFARE';
  image: string;
}

export const THEME_COLOR = '#7C3AED'; // bg-purple-600
