import { rtdb, auth } from "./firebase";
import { ref, set, update } from "firebase/database";

export const saveCricketMatches = async (matches: any[]) => {
  const matchesObject: Record<string, any> = {};
  matches.forEach((match) => {
    matchesObject[match.id] = match;
  });
  await set(ref(rtdb, "cricketMatches"), matchesObject);
};

export const saveQuizConfig = async (config: any) => {
  await set(ref(rtdb, "global/quizConfig"), config);
};

export const saveProducts = async (products: any[]) => {
  const productsObject: Record<string, any> = {};
  products.forEach((p) => (productsObject[p.id] = p));
  await set(ref(rtdb, "products"), productsObject);
};

export const saveWelfareProducts = async (products: any[]) => {
  const productsObject: Record<string, any> = {};
  products.forEach((p) => (productsObject[p.id] = p));
  await set(ref(rtdb, "welfareProducts"), productsObject);
};

export const saveMatchRooms = async (rooms: any[]) => {
  const roomsObject: Record<string, any> = {};
  rooms.forEach((room) => {
    roomsObject[room.id] = room;
  });
  await set(ref(rtdb, "tournaments"), roomsObject);
};

export const saveJoinedTournaments = async (joined: any[]) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    joinedTournaments: joined,
  });
};

export const saveTournamentDetails = async (tournamentId: any, details: { inGameName: string, gameUid: string }) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}/tournamentDetails/${tournamentId}`), details);
};

export const saveJoinedMatches = async (joined: Record<number, string>) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    joinedMatches: joined,
  });
};

export const saveBankDetails = async (bankDetails: any) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    bankDetails,
  });
};

export const addCoinsToWallet = async (
  amount: number,
  currentCoins: number,
) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    coins: currentCoins + amount,
  });
};

export const deductCoinsFromWallet = async (
  amount: number,
  currentCoins: number,
): Promise<boolean> => {
  if (!auth.currentUser) return false;
  if (currentCoins >= amount) {
    await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
      coins: currentCoins - amount,
    });
    return true;
  }
  return false;
};

export const saveEarnTasks = async (tasks: any[]) => {
  const updates: Record<string, any> = {};
  tasks.forEach((task) => {
    updates[`earnTasks/${task.id}`] = task;
  });
  await update(ref(rtdb), updates);
};

export const markEarnTaskClaimed = async (taskId: number, currentClaimed: number[]) => {
  if (!auth.currentUser) return;
  const newClaimed = Array.from(new Set([...(currentClaimed || []), taskId]));
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    claimedEarnTasks: newClaimed,
  });
};
