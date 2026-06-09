import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bollywood Plan',
    price: 500,
    dailyIncome: 120,
    totalIncome: 3600,
    validity: 30,
    category: 'DAILY',
    image: 'https://images.unsplash.com/photo-1542204113-e93847e2124b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    name: 'JioHotstar Plan',
    price: 1500,
    dailyIncome: 450,
    totalIncome: 13500,
    validity: 30,
    category: 'DAILY',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    name: 'Prime Video Plan',
    price: 3000,
    dailyIncome: 950,
    totalIncome: 28500,
    validity: 30,
    category: 'DAILY',
    image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Welfare Starter',
    price: 200,
    dailyIncome: 100,
    totalIncome: 500,
    validity: 5,
    category: 'WELFARE',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
  },
];

export const TOP_WINNERS = [
  { name: 'Yogesh P.', amount: '₹15,000', time: '2m ago' },
  { name: 'Rahul S.', amount: '₹8,400', time: '5m ago' },
  { name: 'Ankita M.', amount: '₹12,200', time: '8m ago' },
  { name: 'Deepak K.', amount: '₹6,500', time: '12m ago' },
];
