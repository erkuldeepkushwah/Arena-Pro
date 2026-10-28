import { useState, useEffect } from "react";
import { rtdb, auth } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { Transaction } from "../utils/transactions";
import { onAuthStateChanged } from "firebase/auth";

export const useCricketMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "cricketMatches"),
      (snap) => {
        if (snap.exists()) {
          setMatches(Object.values(snap.val() || {}) as any[]);
        } else {
          setMatches([]);
        }
      },
      console.error,
    );
  }, []);
  return matches;
};

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "products"),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          setProducts(Object.values(val));
        } else {
          setProducts([]);
        }
      },
      (err) => console.error(err)
    );
  }, []);
  return products;
};

export const useWelfareProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "welfareProducts"),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          setProducts(Object.values(val));
        } else {
          setProducts([]);
        }
      },
      (err) => console.error(err)
    );
  }, []);
  return products;
};

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "tournaments"),
      (snap) => {
        if (snap.exists()) {
          setTournaments(Object.values(snap.val() || {}) as any[]);
        } else {
          setTournaments([]);
        }
      },
      console.error,
    );
  }, []);
  return tournaments;
};

export const useQuizConfig = () => {
  const [config, setConfig] = useState<any>({ entryFee: 10, questions: [] });
  useEffect(() => {
    return onValue(
      ref(rtdb, "global/quizConfig"),
      (snap) => {
        if (snap.exists()) setConfig(snap.val());
        else setConfig({ 
          entryFee: 10, 
          questions: [
            { text: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctIdx: 1 },
            { text: "Who won the Cricket World Cup 2023?", options: ["India", "Australia", "England", "Pakistan"], correctIdx: 1 },
            { text: "What does BGMI stand for?", options: ["Battleground Mobile India", "Battle Games Mobile India", "Battleground Multiplayer India", "None"], correctIdx: 0 },
            { text: "What runs but never walks?", options: ["River", "Car", "Clock", "Shadow"], correctIdx: 0 },
            { text: "What has keys but can't open locks?", options: ["Piano", "Map", "Door", "Chest"], correctIdx: 0 }
          ] 
        });
      },
      console.error,
    );
  }, []);
  return config;
};

export const useEarnTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "earnTasks"),
      (snap) => {
        const defaultTasks = [
          {
            id: 1,
            title: "YouTube Watch & Like Video",
            desc: "Watch the video and like it on YouTube",
            iconType: "youtube",
            coins: 5,
            btnText: "Watch",
            url: "https://youtube.com",
          },
          {
            id: 2,
            title: "YouTube Subscribe Channel",
            desc: "Subscribe the YouTube channel",
            iconType: "youtube",
            coins: 10,
            btnText: "Subscribe",
            url: "https://youtube.com",
          },
          {
            id: 3,
            title: "Instagram Post Like",
            desc: "Like the Instagram post",
            iconType: "instagram",
            coins: 2,
            btnText: "Like",
            url: "https://instagram.com",
          },
          {
            id: 4,
            title: "Instagram Page Follow",
            desc: "Follow the Instagram page",
            iconType: "instagram",
            coins: 10,
            btnText: "Follow",
            url: "https://instagram.com",
          },
          {
            id: 5,
            title: "Instagram Real Like",
            desc: "Get real likes on your Instagram post",
            iconType: "instagram",
            coins: 5,
            btnText: "Like",
            url: "https://instagram.com",
          },
          {
            id: 6,
            title: "Join Telegram",
            desc: "Join our Telegram channel/group",
            iconType: "telegram",
            coins: 5,
            btnText: "Join",
            url: "https://telegram.org",
          },
          {
            id: 7,
            title: "Share Link URL",
            desc: "Share the link with your friends",
            iconType: "link",
            coins: 10,
            btnText: "Share",
            url: "https://example.com",
          },
        ];

        if (snap.exists()) {
          const fetchedTasks = Object.values(snap.val() || {}) as any[];
          const fetchedIds = fetchedTasks.map((t) => t.id);
          const uniqueDefaults = defaultTasks.filter((m) => !fetchedIds.includes(m.id));
          setTasks([...uniqueDefaults, ...fetchedTasks].sort((a, b) => a.id - b.id));
        } else {
          setTasks(defaultTasks);
        }
      },
      console.error,
    );
  }, []);
  return tasks;
};

export const useTopPromotions = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "topPromotions"),
      (snap) => {
        const val = snap.val();
        // Empty until the admin publishes a leaderboard from the dashboard —
        // better than showing invented names as if they were real players.
        if (val && typeof val === 'object') {
          setPromotions(Object.values(val));
        } else {
          setPromotions([]);
        }
      },
      console.error,
    );
  }, []);
  return promotions;
};

/**
 * Requests now live under the requesting user — `withdrawalRequests/{uid}/{id}`
 * — so a player can only read their own and the admin can still read the lot.
 * The flat shape this hook returns is unchanged, so the dashboard didn't need
 * rewriting.
 */
const flattenRequests = (val: any): any[] => {
  if (!val || typeof val !== "object") return [];
  const rows: any[] = [];
  Object.entries(val).forEach(([uid, byId]: [string, any]) => {
    if (!byId || typeof byId !== "object") return;
    Object.entries(byId).forEach(([id, value]: [string, any]) => {
      rows.push({ id, uid: value?.uid || uid, ...value });
    });
  });
  return rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

const useRequestCollection = (node: string) => {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, node),
      (snap) => setRequests(flattenRequests(snap.val())),
      console.error,
    );
  }, [node]);
  return requests;
};

/** The signed-in player's own requests — no other user's data is fetched. */
const useMyRequests = (node: string) => {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(() => {
    let unsub = () => {};
    const authUnsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        setRequests([]);
        return;
      }
      unsub = onValue(
        ref(rtdb, `${node}/${user.uid}`),
        (snap) => {
          const val = snap.val();
          if (!val || typeof val !== "object") {
            setRequests([]);
            return;
          }
          setRequests(
            Object.entries(val)
              .map(([id, value]: [string, any]) => ({ id, uid: user.uid, ...value }))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
          );
        },
        console.error,
      );
    });
    return () => {
      authUnsub();
      unsub();
    };
  }, [node]);
  return requests;
};

export const useWithdrawalRequests = () => useRequestCollection("withdrawalRequests");
export const useRechargeRequests = () => useRequestCollection("rechargeRequests");
export const useMyWithdrawalRequests = () => useMyRequests("withdrawalRequests");
export const useMyRechargeRequests = () => useMyRequests("rechargeRequests");

export const useAllUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    return onValue(
      ref(rtdb, "users"),
      (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          const usersArray = Object.keys(val).map((uid) => ({
            uid,
            ...val[uid],
          }));
          setUsers(usersArray);
        } else {
          setUsers([]);
        }
      },
      console.error,
    );
  }, []);
  return users;
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    let rtdbUnsub: any = null;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (rtdbUnsub) {
        rtdbUnsub();
        rtdbUnsub = null;
      }
      if (!user) {
        setProfile(null);
        return;
      }
      const userRef = ref(rtdb, `users/${user.uid}`);
      rtdbUnsub = onValue(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.val());
          } else {
            const initial = {
              coins: 0,
              balance: 0,
              joinedTournaments: [],
              joinedMatches: {},
              bankDetails: {},
              claimedEarnTasks: [],
            };
            set(userRef, initial).catch(console.error);
            setProfile(initial);
          }
        },
        console.error,
      );
    });
    return () => {
      authUnsub();
      if (rtdbUnsub) rtdbUnsub();
    };
  }, []);
  return profile;
};


/**
 * The signed-in user's ledger, newest first.
 *
 * Every wallet movement is also appended to `users/{uid}/transactions` by
 * `logTransaction()`, so this is the single place the history screen reads.
 */
export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    let unsub = () => {};
    const authUnsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        setTransactions([]);
        return;
      }
      unsub = onValue(
        ref(rtdb, `users/${user.uid}/transactions`),
        (snap) => {
          const val = snap.val();
          if (!val) {
            setTransactions([]);
            return;
          }
          const rows = Object.values(val) as Transaction[];
          setTransactions(rows.sort((a, b) => (b.date || 0) - (a.date || 0)));
        },
        console.error,
      );
    });
    return () => {
      authUnsub();
      unsub();
    };
  }, []);
  return transactions;
};
