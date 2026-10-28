import { push, ref, update } from "firebase/database";
import { rtdb } from "../firebase";

export type TxType =
  | "deposit"
  | "withdraw"
  | "game-entry"
  | "winnings"
  | "prize"
  | "task"
  | "refund";

export type TxStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  status: TxStatus;
  /** Epoch millis. */
  date: number;
  description: string;
}

/** How each type renders: label plus whether the amount credits the wallet. */
export const TX_META: Record<TxType, { label: string; credits: boolean }> = {
  deposit: { label: "Wallet top-up", credits: true },
  withdraw: { label: "Withdrawal", credits: false },
  "game-entry": { label: "Match entry", credits: false },
  winnings: { label: "Match winnings", credits: true },
  prize: { label: "Weekly prize", credits: true },
  task: { label: "Task reward", credits: true },
  refund: { label: "Refund", credits: true },
};

/**
 * Append one row to a user's ledger at `users/{uid}/transactions/{key}`.
 *
 * Deliberately never throws: a bookkeeping failure must not roll back the
 * action that produced it (the coins have already moved by the time we log).
 */
export const logTransaction = async (
  uid: string | null | undefined,
  tx: { type: TxType; amount: number; description: string; status?: TxStatus; date?: number },
): Promise<void> => {
  if (!uid) return;
  try {
    const key = push(ref(rtdb, `users/${uid}/transactions`)).key;
    if (!key) return;
    await update(ref(rtdb, `users/${uid}/transactions/${key}`), {
      id: key,
      type: tx.type,
      amount: Number(tx.amount) || 0,
      status: tx.status ?? "completed",
      description: tx.description,
      date: tx.date ?? Date.now(),
    });
  } catch (error) {
    console.error("Failed to write transaction", error);
  }
};
