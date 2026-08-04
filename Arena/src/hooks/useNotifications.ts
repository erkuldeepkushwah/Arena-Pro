import { useMemo } from 'react';
import { auth } from '../firebase';
import { 
  useUserProfile, 
  useTournaments, 
  useCricketMatches, 
  useRechargeRequests, 
  useWithdrawalRequests 
} from './useFirebaseData';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
  time: number;
}

export const useNotifications = (): AppNotification[] => {
  const userProfile = useUserProfile();
  const tournaments = useTournaments();
  const cricketMatches = useCricketMatches();
  const rechargeReqs = useRechargeRequests();
  const withdrawReqs = useWithdrawalRequests();

  return useMemo(() => {
    if (!userProfile) return [];
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

    const notifs: AppNotification[] = [];

    // 1. E-Sports ID & Password & Results
    tournaments.forEach((t) => {
      // Check joined
      const isJoined = userProfile.joinedTournaments?.includes(t.id);
      if (isJoined) {
        if (t.roomDetails?.id || t.roomDetails?.password) {
          notifs.push({
            id: `esports-room-${t.id}-${t.roomDetails?.id}-${t.roomDetails?.password}`,
            title: `${t.game} Match Details`,
            message: `ID: ${t.roomDetails?.id || 'Not set'} | Pass: ${t.roomDetails?.password || 'Not set'}`,
            type: 'info',
            time: t.timestamp || Date.now() - 1000,
          });
        }

        // Leaderboard Result
        const myResult = t.results?.find((r: any) => r.uid === uid);
        if (myResult?.distributed) {
          notifs.push({
            id: `esports-result-${t.id}`,
            title: `${t.game} Result`,
            message: myResult.isWinner 
              ? `Congratulations! You won with ${myResult.kills} kills. Reward: ${myResult.reward} Coins!` 
              : `Match finished. You got ${myResult.kills} kills. Better luck next time!`,
            type: myResult.isWinner ? 'success' : 'info',
            time: (t.timestamp || Date.now()) + 1000, // Make it appear slightly after room details
          });
        }
      }
    });

    // 2. Recharge requests
    rechargeReqs.forEach((r) => {
      if ((r.uid === uid || r.userId === uid) && (r.status === 'approved' || r.status === 'rejected')) {
        notifs.push({
          id: `recharge-${r.id}`,
          title: `Recharge ${r.status === 'approved' ? 'Successful' : 'Rejected'}`,
          message: r.status === 'approved' 
            ? `Congratulations! ₹${r.amount} has been added to your wallet.` 
            : `Your recharge of ₹${r.amount} was rejected.`,
          type: r.status === 'approved' ? 'success' : 'error',
          time: r.handledAt || r.timestamp || Date.now(),
        });
      }
    });
        
    // 3. Withdrawal requests
    withdrawReqs.forEach((r) => {
      if ((r.uid === uid || r.userId === uid) && (r.status === 'approved' || r.status === 'rejected')) {
        notifs.push({
          id: `withdraw-${r.id}`,
          title: `Withdrawal ${r.status === 'approved' ? 'Successful' : 'Rejected'}`,
          message: r.status === 'approved' 
            ? `Your withdrawal of ₹${r.amount} has been approved.` 
            : `Your withdrawal of ₹${r.amount} was rejected.`,
          type: r.status === 'approved' ? 'success' : 'error',
          time: r.handledAt || r.timestamp || Date.now(),
        });
      }
    });

    // 4. Cricket Betting Results
    cricketMatches.forEach((m) => {
      if (userProfile.joinedMatches?.[m.id] && m.winningTeam) {
        const myTeam = userProfile.joinedMatches[m.id];
        const didWin = m.winningTeam === myTeam;
        notifs.push({
          id: `cricket-${m.id}`,
          title: `Cricket Betting Result`,
          message: didWin 
            ? `Congratulations! ${myTeam} won. You won ${m.entryFee * 2} Coins!` 
            : `${m.winningTeam} won. You lost ${m.entryFee} Coins.`,
          type: didWin ? 'success' : 'error',
          time: m.timestamp || Date.now(),
        });
      }
    });

    // 5. Weekly Leaderboard Winner
    if (userProfile.weeklyWinnerAt) {
      notifs.push({
        id: `weekly-winner-${userProfile.weeklyWinnerAt}`,
        title: `🏆 Weekly Winner Rank #${userProfile.weeklyWinnerRank}!`,
        message: `Congratulations! You are a weekly winner. ₹${userProfile.weeklyWinnerPrize} has been added to your wallet!`,
        type: 'success',
        time: userProfile.weeklyWinnerAt,
      });
    }

    // Sort by time descending (newest first)
    return notifs.sort((a, b) => b.time - a.time);
  }, [userProfile, tournaments, cricketMatches, rechargeReqs, withdrawReqs]);
};
