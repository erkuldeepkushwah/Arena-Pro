import { rtdb, auth } from "./firebase";
import { ref, set, update, increment, runTransaction } from "firebase/database";

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

/**
 * Credit coins.
 *
 * `currentCoins` is accepted for backwards compatibility but deliberately
 * ignored: it came from a render-time snapshot, so `currentCoins + amount`
 * silently overwrote anything another tab (or the admin) had written in the
 * meantime. increment() is applied server-side instead.
 */
export const addCoinsToWallet = async (
  amount: number,
  _currentCoins?: number,
) => {
  if (!auth.currentUser) return;
  await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
    coins: increment(amount),
  });
};

/**
 * Debit coins, atomically.
 *
 * The old version compared a stale `currentCoins` and then wrote
 * `currentCoins - amount`, so two joins from the same account could both pass
 * the check and only one deduction stuck. The transaction aborts when the
 * stored balance is short, and `committed` tells the caller what happened.
 */
export const deductCoinsFromWallet = async (
  amount: number,
  _currentCoins?: number,
): Promise<boolean> => {
  if (!auth.currentUser) return false;
  const result = await runTransaction(
    ref(rtdb, `users/${auth.currentUser.uid}/coins`),
    (coins) => {
      const current = Number(coins || 0);
      if (current < amount) return; // abort, leave the balance untouched
      return current - amount;
    },
  );
  return result.committed;
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
