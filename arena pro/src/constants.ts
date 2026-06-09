import { Product, ReferralTask, Winner } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Bollywood",
    thumbnail: "https://images.unsplash.com/photo-1542204111-730128956c18?w=800&q=80",
    dailyIncome: 10,
    totalIncome: 100,
    price: 1,
    coinsReward: 1,
    validDays: 10,
    category: 'daily',
    isOwned: true
  },
  {
    id: "2",
    title: "JioHotstar",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    dailyIncome: 5,
    totalIncome: 50,
    price: 5,
    coinsReward: 5,
    validDays: 10,
    category: 'daily',
    isOwned: true
  },
  {
    id: "3",
    title: "Prime Video",
    thumbnail: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80",
    dailyIncome: 10,
    totalIncome: 70,
    price: 10,
    coinsReward: 10,
    validDays: 7,
    category: 'daily',
    isOwned: false
  }
];

export const MOCK_REFERRALS: ReferralTask[] = [
  { id: "r1", friendsCount: 1, reward: 10, progress: 0, isClaimed: false },
  { id: "r2", friendsCount: 5, reward: 50, progress: 0, isClaimed: false },
  { id: "r3", friendsCount: 10, reward: 100, progress: 0, isClaimed: false },
  { id: "r4", friendsCount: 20, reward: 200, progress: 0, isClaimed: false },
  { id: "r5", friendsCount: 50, reward: 500, progress: 0, isClaimed: false },
];

export const MOCK_WINNERS: Winner[] = [
  { id: "w1", name: "User", amount: 50, coins: 41, rank: 1 },
  { id: "w2", name: "Komalchand", amount: 25, coins: 40, rank: 2 },
  { id: "w3", name: "Komal", amount: 10, coins: 0, rank: 3 },
];
