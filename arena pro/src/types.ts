export interface User {
  id: string;
  phone: string;
  fullName: string;
  balance: number;
  coins: number;
  referralCode: string;
}

export interface Product {
  id: string;
  title: string;
  thumbnail: string;
  dailyIncome: number;
  totalIncome: number;
  price: number;
  coinsReward: number;
  validDays: number;
  category: 'daily' | 'welfare';
  isOwned?: boolean;
  endTime?: number;
}

export interface ReferralTask {
  id: string;
  friendsCount: number;
  reward: number;
  progress: number;
  isClaimed: boolean;
}

export interface Winner {
  id: string;
  name: string;
  amount: number;
  coins: number;
  rank: number;
}
