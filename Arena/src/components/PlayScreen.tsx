import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Gamepad2,
  Trophy,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Users,
  Swords,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  Gift,
  ChevronRight,
  Target,
  Wallet,
  Calendar,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCricketMatches,
  useTournaments,
  useQuizConfig,
  useUserProfile,
} from "../hooks/useFirebaseData";

import {
  saveJoinedMatches,
  saveJoinedTournaments,
  saveTournamentDetails,
  addCoinsToWallet,
  deductCoinsFromWallet,
} from "../gameplayConfig";

const GAMES_LIST = [
  {
    gameName: "Free Fire Max",
    category: "Battle Royale",
    imageUrl:
      "https://uploads.onecompiler.io/43b6sbecd/446gfse6t/WhatsApp%20Image%202025-12-03%20at%2019.36.31_ca876857.jpg",
    actionLink:
      "https://play.google.com/store/apps/details?id=com.dts.freefiremax",
  },
  {
    gameName: "BGMI",
    category: "Battle Royale",
    imageUrl:
      "https://uploads.onecompiler.io/43b6sbecd/446g46x7e/bgmi.jpeg",
    actionLink:
      "https://play.google.com/store/apps/details?id=com.pubg.imobile",
  },
  {
    gameName: "Call of Duty",
    category: "FPS / Shooter",
    imageUrl:
      "https://uploads.onecompiler.io/43b6sbecd/446g46x7e/cod.jpeg",
    actionLink:
      "https://play.google.com/store/apps/details?id=com.activision.callofduty.shooter",
  },
  {
    gameName: "Scarfall 2.0",
    category: "Tactical Shooter",
    imageUrl:
      "https://uploads.onecompiler.io/43b6sbecd/446g46x7e/sf.jpeg",
    actionLink: "https://play.google.com/store/apps/details?id=com.xs.scarfall",
  },
];

export const PlayScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"match" | "cricket" | "quiz">(
    "match",
  );

  // Dynamic Game Configs
  const QUIZ_CONFIG = useQuizConfig();
  const CRICKET_MATCHES = useCricketMatches();
  const ROOMS = useTournaments();
  const userProfile = useUserProfile();

  const coins = userProfile?.coins || 0;
  const joinedMatches = userProfile?.joinedMatches || {};
  const joinedTournaments = userProfile?.joinedTournaments || [];

  // States
  const [matchView, setMatchView] = useState<
    "games" | "rooms" | "roomDetail" | "result"
  >("games");
  const [roomViewFilter, setRoomViewFilter] = useState<"ongoing" | "upcoming" | "result">("upcoming");
  const [cricketView, setCricketView] = useState<
    "upcoming" | "live" | "ended"
  >("upcoming");
  const [showTeamSelectModal, setShowTeamSelectModal] = useState(false);
  const [quizView, setQuizView] = useState<"start" | "playing" | "result">(
    "start",
  );

  // Selections
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedCricketMatch, setSelectedCricketMatch] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizRewarded, setQuizRewarded] = useState(false);

  const [joinModal, setJoinModal] = useState<{ show: boolean; room: any }>({ show: false, room: null });
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);
  const [inGameUid, setInGameUid] = useState("");
  const [inGameName, setInGameName] = useState("");

  const handleGoToRecharge = () => {
    setShowInsufficientCoinsModal(false);
    // Ideally user is navigated to recharge
    // We would need to pass this up or rely on the parent App.tsx
    // Since PlayScreen.tsx doesn't have onNavigate, let's just dispatch a custom event
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'payment' }));
  };

  const handleJoinTournamentSubmit = async () => {
    if (!inGameUid.trim() || !inGameName.trim()) {
      alert("Please enter both Game UID and Nickname.");
      return;
    }
    const room = joinModal.room;
    const fee = room.entryFee || 0;
    if (fee > 0) {
      if (coins < fee) {
        setShowInsufficientCoinsModal(true);
        setJoinModal({ show: false, room: null });
        return;
      }
      await deductCoinsFromWallet(fee, coins);
    }

    try {
      // Save details locally and remote
      await saveTournamentDetails(room.id, { gameUid: inGameUid, inGameName: inGameName });
      await saveJoinedTournaments([...joinedTournaments, room.id]);
      alert("Successfully joined the match!");
      setJoinModal({ show: false, room: null });
      setInGameUid("");
      setInGameName("");
    } catch(err) {
      alert("Failed to join.");
    }
  };


  useEffect(() => {
    if (quizView === "result" && !quizRewarded) {
      let multiplier = 0;
      if (correctAnswers >= 5) multiplier = 2;
      else if (correctAnswers >= 4) multiplier = 1.5;
      else if (correctAnswers >= 2) multiplier = 1.25;

      const reward = QUIZ_CONFIG.entryFee * multiplier;
      if (reward > 0) {
        addCoinsToWallet(reward, coins);
      }
      setQuizRewarded(true);
    }
  }, [quizView, correctAnswers, QUIZ_CONFIG.entryFee, quizRewarded]);

  // Match Flow
  const renderMatch = () => {
    if (matchView === "games") {
      return (
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-bold">Select Game</h2>
          <div className="grid grid-cols-2 gap-4">
            {GAMES_LIST.map((game) => (
              <div
                key={game.gameName}
                onClick={() => {
                  setSelectedGame(game.gameName);
                  setMatchView("rooms");
                }}
                className="relative w-full aspect-[3/4] rounded-[16px] overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl active:scale-95 transition-all cursor-pointer group"
              >
                <img
                  src={game.imageUrl}
                  alt={game.gameName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col items-start translate-y-1 group-hover:translate-y-0 transition-transform pointer-events-none">
                  <span className="text-white text-[18px] sm:text-[20px] font-black uppercase tracking-wide leading-tight drop-shadow-md">
                    {game.gameName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (matchView === "rooms") {
      const selectedGameObj = GAMES_LIST.find((g) => g.gameName === selectedGame);
      const filteredRooms = ROOMS.filter((room: any) => {
         if (room.game !== selectedGame) return false;
         if (roomViewFilter === "upcoming") return room.status === "upcoming";
         if (roomViewFilter === "ongoing") return room.status === "live";
         if (roomViewFilter === "result") return room.status === "ended";
         return true;
      });

      return (
        <div className="min-h-screen bg-[#fafafa] -m-4">
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <button
              className="w-10 h-10 bg-[#f8f5ff] rounded-full flex flex-shrink-0 items-center justify-center cursor-pointer active:scale-95 transition-all"
              onClick={() => setMatchView("games")}
            >
              <ChevronLeft className="w-5 h-5 text-[#5e35b1] ml-[-2px]" />
            </button>
            <div className="flex-1"></div>
            <div className="w-10"></div>
          </div>

          <div className="p-4 space-y-6 pb-20">
            {/* Banner */}
            <div className="border border-gray-100 rounded-[12px] p-4 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-start gap-1.5 mb-5">
              <span className="text-gray-500 font-medium text-[15px]">Showing:</span>
              <span className="font-bold text-[#5e35b1] text-[15px] uppercase mx-1">{selectedGame}</span>
              <span className="text-gray-500 font-medium text-[15px]">matches</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-full p-1.5 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] mx-1">
              {(["ongoing", "upcoming", "result"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRoomViewFilter(filter)}
                  className={`flex-1 py-3 text-[14px] font-bold rounded-full capitalize transition-all ${
                    roomViewFilter === filter
                      ? "bg-[#5e35b1] text-white shadow-md shadow-purple-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {filteredRooms.map((room: any) => {
                const joinedCount =
                  (room.joinedPlayers?.length || 0) +
                  (joinedTournaments.includes(room.id) ? 1 : 0);
                const total = room.totalSlots || 0;
                const isJoined = joinedTournaments.includes(room.id);
                
                let killPercent = 50;
                let winnerPercent = 30;
                let companyPercent = 20;
                
                if (joinedCount <= 5) {
                  killPercent = 50;
                  winnerPercent = 30;
                  companyPercent = 20;
                } else if (joinedCount <= 10) {
                  killPercent = 55;
                  winnerPercent = 25;
                  companyPercent = 20;
                } else {
                  killPercent = 60;
                  winnerPercent = 20;
                  companyPercent = 20;
                }
                
                // Using exact joinedCount as per user formula
                const mathPlayersJoined = joinedCount;
                const mathTotalCoins = (room.entryFee || 0) * mathPlayersJoined;
                const mathWinnerPool = (mathTotalCoins * winnerPercent) / 100;
                const mathKillPool = (mathTotalCoins * killPercent) / 100;
                // Assuming TotalMatchKills is roughly equal to mathPlayersJoined for Per Kill estimate
                const mathPerKill = mathPlayersJoined > 0 ? mathKillPool / mathPlayersJoined : 0;
                
                return (
                  <div
                    key={room.id}
                    className="bg-white rounded-[28px] p-5 shadow-[0_3px_12px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col relative font-['Inter']"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-5">
                       <div className="flex gap-3.5 items-center">
                        <div className="relative shrink-0">
                          <img
                            src={selectedGameObj?.imageUrl || ""}
                            alt="Game"
                            className="w-[54px] h-[54px] rounded-full object-cover border-[2px] border-yellow-400 p-[2px]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-[#111] text-[17px] mb-1.5 leading-tight flex items-center gap-2">
                            {room.title}
                          </h3>
                          {/* Tags above time */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                                {room.matchType || "SQUAD"}
                              </span>
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                                {room.map || "BERMUDA"}
                              </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#666] font-medium text-[13px]">
                            <Calendar className="w-[14px] h-[14px] text-[#666]" />
                            <span>{room.date} {room.time}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRoom({...room, calculatedPrizePool: mathWinnerPool, calculatedPerKill: mathPerKill});
                          setMatchView("roomDetail");
                        }}
                        className="text-[#6D28D9] font-bold text-[14px] underline decoration-[#c4b5fd] underline-offset-4 flex-shrink-0 pt-1"
                      >
                        View
                      </button>
                    </div>

                    {/* Stats Box */}
                    <div className="flex items-center justify-between border border-gray-100 rounded-[14px] py-4 mb-6 relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                      <div className="flex flex-col items-center flex-1 px-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">Entry Fee:</span>
                        <div className="font-black text-[#111] text-[18px] sm:text-[20px] tracking-tight">{room.entryFee} Coins</div>
                      </div>
                      <div className="w-[1px] h-[40px] bg-gray-100 shrink-0"></div>
                      <div className="flex flex-col items-center flex-1 px-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">Per Kill:</span>
                        <div className="font-black text-[#111] text-[18px] sm:text-[20px] tracking-tight">{Math.floor(mathPerKill)} Coins</div>
                      </div>
                      <div className="w-[1px] h-[40px] bg-gray-100 shrink-0"></div>
                      <div className="flex flex-col items-center flex-1 px-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">Winner Prize:</span>
                        <div className="font-black text-[#111] text-[18px] sm:text-[20px] tracking-tight">{Math.floor(mathWinnerPool)} Coins</div>
                      </div>
                    </div>

                    {/* Progress and Join on same line */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Left side: Progress bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="w-full bg-[#f3f4f6] h-[10px] rounded-full overflow-hidden mb-2 relative">
                           <div
                             className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-full rounded-full transition-all"
                             style={{
                               width: `${(joinedCount / total) * 100}%`,
                             }}
                           ></div>
                        </div>
                        <div className="text-center font-bold text-[13px] text-[#111]">
                           {joinedCount}/{total}
                        </div>
                      </div>

                      {/* Right side: Join button */}
                      <div className="flex-shrink-0">
                        {isJoined ? (
                          <div className="bg-green-50 text-green-700 font-bold text-[14px] px-8 py-2.5 rounded-[12px] border border-green-200">
                            Joined
                          </div>
                        ) : room.status === "live" ? (
                          <div className="bg-red-50 text-red-600 font-bold text-[14px] px-8 py-2.5 rounded-[12px] border border-red-200 animate-pulse">
                            Live
                          </div>
                        ) : room.status === "ended" ? (
                          <div className="bg-gray-100 text-gray-500 font-bold text-[14px] px-8 py-2.5 rounded-[12px] border border-gray-200">
                            Ended
                          </div>
                        ) : joinedCount >= total ? (
                          <div className="bg-[#6D28D9] text-white opacity-50 font-bold text-[14px] px-8 py-2.5 rounded-[12px]">
                            Full
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setJoinModal({ show: true, room });
                            }}
                            className="font-bold text-[14px] px-8 py-2.5 rounded-[12px] transition-transform active:scale-95 tracking-wide shadow-sm"
                            style={{
                                 backgroundColor: "#f5f3ff",
                                 color: "#6D28D9",
                                 border: "none"
                             }}
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRooms.length === 0 && (
                <div className="text-center py-10 bg-white rounded-[24px] shadow-sm border border-gray-100">
                  <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 font-medium">
                    No {roomViewFilter} matches found.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (matchView === "roomDetail") {
      const selectedGameObj = GAMES_LIST.find((g) => g.gameName === selectedRoom?.game);

      return (
        <div className="min-h-screen bg-[#fafafa] text-[#111] -m-4 font-['Inter'] relative h-screen overflow-y-auto pb-24">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sticky top-0 bg-white shadow-sm z-20">
            <button
              onClick={() => setMatchView("rooms")}
              className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-purple-100"
            >
              <ChevronLeft className="w-5 h-5 text-[#5e35b1]" />
            </button>
            <div className="flex-1"></div>
            <div className="w-10"></div>
          </div>

          <div className="p-4 space-y-6">
            {/* Banner Image */}
            <div className="relative w-full h-[160px] rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={selectedGameObj?.imageUrl || "https://uploads.onecompiler.io/43b6sbecd/446gfse6t/WhatsApp%20Image%202025-12-03%20at%2019.36.31_ca876857.jpg"} 
                alt={selectedRoom?.game} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <h3 className="absolute bottom-4 left-4 font-black text-2xl tracking-wide uppercase text-white">
                {selectedRoom?.game || "FREE FIRE MAX"}
              </h3>
            </div>

            {/* Match Info Summary */}
            <div className="flex flex-col gap-2 px-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Type :</span>
                <span className="font-bold text-gray-800">{selectedRoom?.matchType || "Duo"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Map :</span>
                <span className="font-bold text-gray-800">{selectedRoom?.map || "Lone Wolf"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Entry Fee :</span>
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <span className="text-xs">🪙</span>
                  <span>{selectedRoom?.entryFee}</span>
                </span>
              </div>
            </div>

            {/* Room Details Card */}
            <div className="bg-white rounded-[20px] p-6 text-center border border-gray-200 shadow-sm">
              <h4 className="text-[16px] font-bold text-[#111] mb-1">Room Details</h4>
              <p className="text-gray-500 text-[13px] font-medium mb-6">About This Match</p>

              {joinedTournaments.includes(selectedRoom?.id) ? (
                  <>
                    {selectedRoom?.roomDetails?.id ? (
                      <div className="bg-green-50 p-4 rounded-xl mb-6 text-left border border-green-100">
                        <p className="text-[13px] text-gray-600 font-medium mb-2">Room Details are available:</p>
                        <p className="text-[14px] text-[#111] font-bold mb-1.5 flex justify-between">
                          <span>Room ID:</span>
                          <span className="font-black select-all tracking-wider text-green-700">{selectedRoom?.roomDetails?.id}</span>
                        </p>
                        <p className="text-[14px] text-[#111] font-bold flex justify-between">
                          <span>Password:</span>
                          <span className="font-black select-all tracking-wider text-green-700">{selectedRoom?.roomDetails?.password}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[14px] font-bold text-green-600 mb-6 px-4 bg-green-50 py-3 rounded-xl border border-green-100">
                        You're joined! ID & Password will be shared here before start.
                      </p>
                    )}
                    
                    {selectedRoom?.streamLink && (
                      <a
                        href={selectedRoom.streamLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 font-bold rounded-[30px] flex items-center justify-center gap-2 text-[14px] mb-6 hover:bg-red-100 transition-colors"
                      >
                        <PlayCircle className="w-5 h-5" />
                        Watch Live Stream
                      </a>
                    )}
                  </>
                ) : selectedRoom?.status === "ended" ? (
                    <div className="bg-[#fffbf0] p-4 rounded-xl mb-6 border border-yellow-200 shadow-sm relative overflow-hidden">
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-[15px] font-black text-yellow-800 mb-1">Match Finished</p>
                        <p className="text-[12px] font-medium text-yellow-700">Rewards distributed</p>
                    </div>
                ) : selectedRoom?.status !== "upcoming" ? (
                   <p className="text-[14px] font-bold text-gray-500 mb-6 bg-gray-100 py-3 rounded-xl">
                      Match {selectedRoom?.status}
                   </p>
                ) : (selectedRoom?.joinedPlayers?.length || 0) >= selectedRoom?.totalSlots ? (
                    <p className="text-[14px] font-bold text-red-500 mb-6 bg-red-50 py-3 rounded-xl border border-red-100">
                      Match is Full
                    </p>
                ) : (
                   <>
                     <p className="text-[14px] font-bold text-[#111] mb-6">
                       Join the match to check room Id
                     </p>
                     <div className="flex justify-center mb-6">
                       <button
                         onClick={() => setJoinModal({ show: true, room: selectedRoom })}
                         className="bg-[#5e35b1] hover:bg-[#4b2a8d] text-white font-bold py-3 px-12 rounded-[25px] transition-colors shadow-md shadow-purple-200"
                       >
                         Join
                       </button>
                     </div>
                   </>
                )}

              {/* Progress */}
              <div className="pt-5 border-t border-gray-100">
                <p className="text-[14px] font-bold text-gray-600 mb-3 text-left">
                  Participants ({(selectedRoom?.joinedPlayers?.length || 0) + (joinedTournaments.includes(selectedRoom?.id) ? 1 : 0)}/{selectedRoom?.totalSlots})
                </p>
                <div className="w-full bg-purple-50 h-[8px] rounded-full overflow-hidden border border-purple-100">
                  <div
                    className="bg-[#5e35b1] h-full rounded-full transition-all"
                    style={{
                      width: `${(((selectedRoom?.joinedPlayers?.length || 0) + (joinedTournaments.includes(selectedRoom?.id) ? 1 : 0)) / selectedRoom?.totalSlots) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tournament Rules Section */}
            <div>
              <div className="flex items-center gap-3 mb-5 pl-1">
                <div className="w-1 h-5 bg-[#5e35b1] rounded-full"></div>
                <h3 className="text-lg font-black text-[#111] uppercase tracking-wide">Tournament Rules</h3>
              </div>

              <div className="space-y-3">
                {[
                    "PLEASE READ ALL RULES BEFORE PLAYING / कृपया खेलने से पहले सभी नियम पढ़ें",
                    "You will get Room ID & Password 5-10 minutes before the match time. / आपको मैच समय से 10 से 5 मिनट पहले रूम आईडी और पासवर्ड मिल जाएगा",
                    "Screen recording is mandatory while playing BattleOp matches. / बैटलेओपी मैच खेलते समय हमेशा ऑन स्क्रीन रिकॉर्डिंग चालू रखें",
                    "Minimum game level should be 40. / कम से कम गेम का लेवल 40 होना चाहिए",
                    "Headshot (%) should not be more than 70% in BR Career mode. / बी आर करियर मोड में हेडशॉट 70% से अधिक नहीं होना चाहिए",
                    "DO NOT INVITE AND DO NOT LEAK ID/PASS. / रूम की डिटेल किसी अनजान प्लेयर्स को शेयर ना करे",
                    "Team-up is not allowed. / टीमअप की अनुमति नहीं है",
                    "Refund for players who are killed by hackers (with proof). / हैकर्स द्वारा मारे गए खिलाड़ियों को रिफंड मिलेगा (सबूत के साथ)",
                    "PC & Emulators are not allowed. / पीसी और एमुलेटर की अनुमति नहीं है"
                ].map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-[16px] p-4 flex gap-4 items-start border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    <div className="bg-purple-100 text-[#5e35b1] w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 text-[13px] font-semibold leading-[1.5]">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      );
    }

    if (matchView === "result") {
      return (
        <div className="p-4 text-center space-y-6 mt-10">
          <Trophy className="w-20 h-20 text-[#fbbf24] mx-auto" />
          <h2 className="text-2xl font-bold">Match Finished</h2>
          <p className="text-gray-500">
            Your results have been updated successfully!
          </p>
          <button
            onClick={() => setMatchView("games")}
            className="w-full bg-[#6D28D9] text-white py-3 rounded-xl font-bold"
          >
            Back to Games
          </button>
        </div>
      );
    }
  };

  // Cricket Flow
  const renderCricket = () => {
    if (
      cricketView === "upcoming" ||
      cricketView === "live" ||
      cricketView === "ended"
    ) {
      const displayMatches = CRICKET_MATCHES.filter(
        (m) => m.status === cricketView,
      );

      return (
        <div className="min-h-screen bg-[#fafafa] -m-4">
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-10">
            <div
              className="w-10 h-10 bg-purple-50 rounded-full flex flex-shrink-0 items-center justify-center cursor-pointer active:scale-95 transition-all"
              onClick={() => setActiveTab("match")}
            >
              <ChevronLeft className="w-5 h-5 text-[#5e35b1]" />
            </div>
            <div className="flex-1"></div>
            <div className="w-10"></div>
          </div>

          <div className="p-4 space-y-5">
            {/* Banner */}
            <div className="border border-purple-100 rounded-[12px] px-4 py-3.5 bg-white flex flex-wrap items-center gap-1.5">
              <span className="text-gray-500 font-medium text-sm">Showing: </span>
              <span className="font-bold text-[#5e35b1] text-sm tracking-wide uppercase">CRICKET</span>
              <span className="text-gray-500 font-medium text-sm">matches</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-full p-1 border border-gray-100 shadow-sm">
              <button
                onClick={() => setCricketView("live")}
                className={`flex-1 py-3 text-sm font-bold rounded-full capitalize transition-all ${
                  cricketView === "live"
                    ? "bg-[#5e35b1] text-white shadow-md shadow-purple-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setCricketView("upcoming")}
                className={`flex-1 py-3 text-sm font-bold rounded-full capitalize transition-all ${
                  cricketView === "upcoming"
                    ? "bg-[#5e35b1] text-white shadow-md shadow-purple-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setCricketView("ended")}
                className={`flex-1 py-3 text-sm font-bold rounded-full capitalize transition-all ${
                  cricketView === "ended"
                    ? "bg-[#5e35b1] text-white shadow-md shadow-purple-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Result
              </button>
            </div>

            {displayMatches.length === 0 && (
              <div className="text-center py-10 bg-white rounded-[24px] shadow-sm border border-gray-100">
                <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No matches available.</p>
              </div>
            )}

            <div className="space-y-4">
              {displayMatches.map((match) => (
                <div
                   key={match.id}
                   className="bg-white rounded-[20px] sm:rounded-[28px] p-[16px] sm:p-[28px] shadow-[0_3px_12px_rgba(0,0,0,0.08)] flex flex-col mb-4 sm:mb-5 relative font-['Inter']"
                 >
                    {match.status === "live" && (
                       <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[12px] sm:text-[14px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-10 bg-red-100 text-red-600 animate-pulse">
                          LIVE
                       </div>
                    )}

                    <div className="flex justify-between items-center relative mb-4 sm:mb-6 mt-1 sm:mt-2">
                       <div className="flex flex-col items-center shrink-0 w-[50px] sm:w-[80px]">
                          {match.team1.logoUrl ? (
                             <img src={match.team1.logoUrl} alt={match.team1.short} className="w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] object-contain mb-1 sm:mb-2" />
                          ) : (
                             <div className="w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-[14px] sm:text-2xl mb-1 sm:mb-2 shadow-sm object-contain">
                                {match.team1.short}
                             </div>
                          )}
                          <span className="text-[12px] sm:text-[20px] font-bold text-[#111] text-center uppercase tracking-wide">{match.team1.short}</span>
                       </div>

                       <div className="flex flex-col items-center flex-1 px-1 sm:px-4 text-center">
                          <span className="text-gray-500 font-medium text-[13px] sm:text-[32px] mb-1 sm:mb-2 leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full">
                             {match.title}
                          </span>
                          <h3 className="font-bold text-[#111] text-[18px] sm:text-[48px] leading-tight mb-1 tracking-tight">
                             {match.team1.short} vs {match.team2.short}
                          </h3>
                          {match.status === "upcoming" && (
                             <span className="text-gray-500 font-medium text-[12px] sm:text-[20px] mt-0.5 sm:mt-1">{match.time}</span>
                          )}
                       </div>

                       <div className="flex flex-col items-center shrink-0 w-[50px] sm:w-[80px]">
                          {match.team2.logoUrl ? (
                             <img src={match.team2.logoUrl} alt={match.team2.short} className="w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] object-contain mb-1 sm:mb-2" />
                          ) : (
                             <div className="w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] bg-green-50 border border-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-[14px] sm:text-2xl mb-1 sm:mb-2 shadow-sm object-contain">
                                {match.team2.short}
                             </div>
                          )}
                          <span className="text-[12px] sm:text-[20px] font-bold text-[#111] text-center uppercase tracking-wide">{match.team2.short}</span>
                       </div>
                    </div>

                    <div className="flex items-center w-full justify-between">
                       <div className="flex items-center gap-6 sm:gap-12">
                           <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                              <span className="text-[11px] sm:text-[14px] font-bold text-gray-500 uppercase tracking-wide">
                                 ENTRY FEE:
                              </span>
                              <span className="font-bold text-black text-[15px] sm:text-[20px] leading-none">
                                 {match.entryFee} Coins
                              </span>
                           </div>
                           
                           <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                              <span className="text-[11px] sm:text-[14px] font-bold text-gray-500 uppercase tracking-wide">
                                {match.status === 'ended' ? 'WINNER POINT:' : 'WINNINGS:'}
                              </span>
                              <span className="font-bold text-black text-[15px] sm:text-[20px] leading-none">
                                 {match.entryFee * 2} Coins
                              </span>
                           </div>
                       </div>

                       {!joinedMatches[match.id] && match.status === "upcoming" && (
                          <div className="flex justify-end shrink-0 pl-2">
                             <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCricketMatch(match);
                                  setSelectedTeam(null);
                                  setShowTeamSelectModal(true);
                                }}
                                className="font-bold text-[14px] px-8 py-2.5 rounded-[12px] transition-transform active:scale-95 tracking-wide shadow-sm"
                                style={{ backgroundColor: "#f5f3ff", color: "#6D28D9", border: "none" }}
                             >
                               Join
                             </button>
                          </div>
                       )}
                    </div>

                    {(joinedMatches[match.id] || match.status === "ended") && (
                       <>
                          <hr className="border-gray-200 w-full mt-4 sm:mt-6 mb-3 sm:mb-5" />
                          <div className="flex flex-row items-center justify-between gap-2 overflow-hidden">
                             <span className="font-bold text-[#111] text-[14px] sm:text-[22px] shrink-0">
                                {match.status === 'ended' ? 'Winner' : 'Joined'}
                             </span>
                             <div className="bg-[#d8f2d8] text-[#1c6426] text-[11px] sm:text-[18px] font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-[8px] sm:rounded-[18px] truncate max-w-[70%] sm:max-w-full text-right ml-auto">
                                {joinedMatches[match.id] === match.team1.short ? match.team1.name : joinedMatches[match.id] === match.team2.short ? match.team2.name : (joinedMatches[match.id] ? `${joinedMatches[match.id]} Team` : (match.winningTeam === match.team1.short ? match.team1.name : match.winningTeam === match.team2.short ? match.team2.name : match.winningTeam || 'Winner Team'))}
                             </div>
                          </div>
                       </>
                    )}
                 </div>
              ))}
            </div>

            {/* Team Selection Modal */}
            {showTeamSelectModal && selectedCricketMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h3 className="font-black text-[#111] text-lg leading-tight uppercase tracking-wide">Select Team</h3>
                      <p className="text-gray-500 text-xs font-bold mt-0.5">{selectedCricketMatch.title}</p>
                    </div>
                    <button 
                      onClick={() => setShowTeamSelectModal(false)}
                      className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-8 px-2 relative">
                      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 -z-10"></div>
                      
                      {/* Team 1 */}
                      <div className="flex flex-col items-center gap-2 relative bg-white px-2">
                        <div
                          className={`w-16 h-16 ${selectedTeam === selectedCricketMatch.team1.short ? "bg-purple-100 border-[3px] border-purple-500 shadow-md shadow-purple-500/20 scale-110" : "bg-blue-50 border border-blue-100 hover:bg-blue-100"} rounded-full flex items-center justify-center font-bold text-blue-700 transition-all cursor-pointer`}
                          onClick={() => setSelectedTeam(selectedCricketMatch.team1.short)}
                        >
                          {selectedCricketMatch.team1.logoUrl ? (
                            <img src={selectedCricketMatch.team1.logoUrl} alt={selectedCricketMatch.team1.short} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="text-lg">{selectedCricketMatch.team1.short}</span>
                          )}
                        </div>
                        <span className="text-[13px] font-bold text-gray-800 uppercase max-w-[80px] text-center truncate">{selectedCricketMatch.team1.short}</span>
                      </div>
                      
                      <div className="text-sm font-black text-gray-300 bg-white px-2">VS</div>
                      
                      {/* Team 2 */}
                      <div className="flex flex-col items-center gap-2 relative bg-white px-2">
                        <div
                          className={`w-16 h-16 ${selectedTeam === selectedCricketMatch.team2.short ? "bg-purple-100 border-[3px] border-purple-500 shadow-md shadow-purple-500/20 scale-110" : "bg-green-50 border border-green-100 hover:bg-green-100"} rounded-full flex items-center justify-center font-bold text-green-700 transition-all cursor-pointer`}
                          onClick={() => setSelectedTeam(selectedCricketMatch.team2.short)}
                        >
                          {selectedCricketMatch.team2.logoUrl ? (
                            <img src={selectedCricketMatch.team2.logoUrl} alt={selectedCricketMatch.team2.short} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="text-lg">{selectedCricketMatch.team2.short}</span>
                          )}
                        </div>
                        <span className="text-[13px] font-bold text-gray-800 uppercase max-w-[80px] text-center truncate">{selectedCricketMatch.team2.short}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-[#f8f5ff] rounded-xl border border-purple-100 mb-6">
                      <span className="text-sm font-bold text-gray-600">Entry Fee</span>
                      <div className="flex items-center gap-1 font-black text-[#5e35b1] text-lg">
                        <span className="text-sm">🪙</span> {selectedCricketMatch.entryFee}
                      </div>
                    </div>

                    <button
                      disabled={!selectedTeam}
                      onClick={() => {
                        if (selectedTeam) {
                          const fee = selectedCricketMatch.entryFee || 0;
                          if (fee > 0) {
                            if (coins < fee) {
                              setShowInsufficientCoinsModal(true);
                              setShowTeamSelectModal(false);
                              return;
                            }
                            deductCoinsFromWallet(fee, coins); // We can just call it asynchronously here since onClick is not async? Wait, we can make onClick async
                          }
                          saveJoinedMatches({
                            ...joinedMatches,
                            [selectedCricketMatch.id]: selectedTeam,
                          });
                          alert(`Successfully joined with ${fee} Coins!`);
                          setShowTeamSelectModal(false);
                        }
                      }}
                      className={`w-full py-4 rounded-[16px] font-bold text-[16px] text-white transition-all shadow-sm ${selectedTeam ? "bg-[#333] hover:bg-[#111] active:scale-[0.98]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                      {selectedTeam ? `Join Match` : "Select a Team"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Quiz Flow
  const renderQuiz = () => {
    if (quizView === "start") {
      return (
        <div className="p-4 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 flex flex-col items-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-8 left-8">
              <Sparkles
                className="w-3 h-3 text-green-300 opacity-60"
                fill="currentColor"
              />
            </div>
            <div className="absolute bottom-24 right-8">
              <Sparkles
                className="w-3 h-3 text-purple-300 opacity-60"
                fill="currentColor"
              />
            </div>
            <div className="absolute top-12 right-12">
              <Sparkles
                className="w-4 h-4 text-yellow-400 opacity-60"
                fill="currentColor"
              />
            </div>
            <div className="absolute top-24 left-10">
              <Sparkles
                className="w-2.5 h-2.5 text-yellow-500 opacity-60"
                fill="currentColor"
              />
            </div>

            <div className="relative inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-md shadow-purple-500/20 mb-6 border-[4px] border-purple-50 z-10 mt-2">
              <div className="w-[96px] h-[96px] bg-white rounded-full flex items-center justify-center">
                <span className="text-[#6D28D9] text-[56px] font-black drop-shadow-sm leading-none pt-1">
                  ?
                </span>
              </div>
              <div className="absolute -bottom-2 bg-gradient-to-b from-yellow-400 to-yellow-500 text-[9px] font-black px-4 py-1 rounded uppercase tracking-wider text-yellow-950 border-b-2 border-yellow-600 shadow-sm shadow-yellow-500/30">
                UP TO 2X
              </div>
              {/* Ribbon tails */}
              <div
                className="absolute -bottom-1 -left-2 w-0 h-0 border-t-[8px] border-t-yellow-600 border-l-[8px] border-l-transparent"
                style={{ zIndex: -1 }}
              ></div>
              <div
                className="absolute -bottom-1 -right-2 w-0 h-0 border-t-[8px] border-t-yellow-600 border-r-[8px] border-r-transparent"
                style={{ zIndex: -1 }}
              ></div>
            </div>

            <div className="text-center mb-5">
              <h2 className="text-[22px] font-black text-[#111] mb-1 tracking-tight">
                Daily Quiz Challenge
              </h2>
              <p className="text-gray-500 text-sm">
                Answer correctly to{" "}
                <span className="font-bold text-[#6D28D9]">multiply</span> your
                coins!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mb-5">
              <div className="bg-white border border-green-100 rounded-xl p-2.5 flex flex-col items-center shadow-sm shadow-green-500/5">
                <div className="flex items-center gap-1 text-green-600 font-bold text-xs mb-1">
                  <StarIcon className="w-3 h-3 fill-current" />
                  2+ Right
                </div>
                <div className="text-green-600 font-black text-xl">1.25x</div>
              </div>
              <div className="bg-white border border-blue-100 rounded-xl p-2.5 flex flex-col items-center shadow-sm shadow-blue-500/5">
                <div className="flex items-center gap-1 text-blue-500 font-bold text-xs mb-1">
                  <StarIcon className="w-3 h-3 fill-current" />4 Right
                </div>
                <div className="text-blue-500 font-black text-xl">1.5x</div>
              </div>
              <div className="bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center shadow-sm shadow-purple-500/5">
                <div className="flex items-center gap-1 text-purple-600 font-bold text-xs mb-1">
                  <StarIcon className="w-3 h-3 fill-current" />5 Right
                </div>
                <div className="text-purple-600 font-black text-xl">2x</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-2 px-5 py-2.5 rounded-full mb-5 text-sm font-medium">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <StarIcon className="w-3 h-3 text-yellow-100 fill-white" />
              </div>
              <span className="text-gray-500">Entry Fee:</span>
              <span className="font-black text-[#111]">10 Coins</span>
            </div>

            <button
              onClick={async () => {
                const fee = QUIZ_CONFIG.entryFee || 0;
                if (fee > 0) {
                  if (coins < fee) {
                    setShowInsufficientCoinsModal(true);
                    return;
                  }
                  await deductCoinsFromWallet(fee, coins);
                }
                setCurrentQuestionIdx(0);
                setCorrectAnswers(0);
                setQuizRewarded(false);
                setQuizView("playing");
              }}
              className="w-[200px] bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white py-3.5 rounded-[18px] font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 text-base transition-transform active:scale-[0.98] mx-auto"
            >
              <PlayCircle className="w-5 h-5 fill-white text-purple-600" />
              Play
            </button>
          </div>
        </div>
      );
    }

    if (quizView === "playing") {
      const q = QUIZ_CONFIG.questions[currentQuestionIdx];
      return (
        <div className="p-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <span className="font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
              Question {currentQuestionIdx + 1}/{QUIZ_CONFIG.questions.length}
            </span>
            <span className="font-bold text-[#6D28D9] bg-purple-50 px-3 py-1 rounded-full text-sm">
              Correct: {correctAnswers}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${(currentQuestionIdx / QUIZ_CONFIG.questions.length) * 100}%`,
                }}
              ></div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-8 mt-2 leading-snug">
              {q.q}
            </h3>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const isCorrect = i === q.correctIdx;
                    if (isCorrect) setCorrectAnswers((prev) => prev + 1);

                    if (currentQuestionIdx < QUIZ_CONFIG.questions.length - 1) {
                      setCurrentQuestionIdx((prev) => prev + 1);
                    } else {
                      // Finished
                      if (isCorrect) setCorrectAnswers((prev) => prev + 1); // need to update immediately for result logic
                      setTimeout(() => setQuizView("result"), 300); // slight delay for visual processing
                    }
                  }}
                  className="w-full text-left bg-gray-50 p-4 rounded-xl border-2 border-transparent font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 transition-all active:scale-[0.98]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (quizView === "result") {
      let multiplier = 0;
      if (correctAnswers >= 5) multiplier = 2;
      else if (correctAnswers >= 4) multiplier = 1.5;
      else if (correctAnswers >= 2) multiplier = 1.25;

      const reward = QUIZ_CONFIG.entryFee * multiplier;
      const isWinner = reward > 0;

      return (
        <div className="p-4 text-center space-y-6 mt-10">
          {isWinner ? (
            <Trophy className="w-24 h-24 text-[#fbbf24] mx-auto drop-shadow-lg" />
          ) : (
            <XCircle className="w-24 h-24 text-red-400 mx-auto drop-shadow-md" />
          )}

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {isWinner ? "Quiz Completed!" : "Better luck next time!"}
            </h2>
            <p className="text-gray-500">
              You answered{" "}
              <span className="font-bold text-black">{correctAnswers}</span> out
              of {QUIZ_CONFIG.questions.length} correctly.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${isWinner ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}
          >
            <p
              className={`text-lg font-bold ${isWinner ? "text-yellow-700" : "text-gray-600"}`}
            >
              {isWinner ? `You won ${reward} Coins! 🎉` : "You won 0 Coins."}
            </p>
          </div>

          <button
            onClick={() => {
              setQuizView("start");
              setCurrentQuestionIdx(0);
              setCorrectAnswers(0);
              setQuizRewarded(false);
            }}
            className="w-full bg-[#6D28D9] text-white py-3.5 rounded-xl font-bold shadow-md shadow-purple-500/20 active:scale-[0.98] transition-transform"
          >
            Back to Quiz Base
          </button>
        </div>
      );
    }
  };

  return (
    <div className="pb-28 bg-[#f8f9fa] min-h-screen font-sans relative">
      <AnimatePresence>
        {showInsufficientCoinsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 text-center border-t-4 border-red-500 overflow-hidden relative"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Insufficient Coins</h3>
              <p className="text-gray-600 font-medium text-[15px] mb-6">
                You do not have enough coins to play the quiz. Please recharge your wallet to continue.
              </p>
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowInsufficientCoinsModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-[14px] transition-colors hover:bg-gray-200"
                >
                  Close
                </button>
                <button 
                  onClick={handleGoToRecharge}
                  className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-[14px] transition-colors hover:bg-red-600 shadow-sm"
                >
                  Recharge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="px-5 mb-2 mt-4">
        <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] h-12">
          <button
            onClick={() => setActiveTab("match")}
            className={`flex-1 flex items-center justify-center gap-1.5 transition-all rounded-lg ${
              activeTab === "match"
                ? "bg-gradient-to-b from-[#8042f6] to-[#6d28d9] text-white shadow-sm shadow-purple-500/20"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <img
              src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/team.png"
              alt="Match"
              className={`w-4 h-4 object-contain ${activeTab === "match" ? "brightness-0 invert" : ""}`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${activeTab === "match" ? "" : "text-gray-500"}`}
            >
              Match
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cricket")}
            className={`flex-1 flex items-center justify-center gap-1.5 transition-all rounded-lg ${
              activeTab === "cricket"
                ? "bg-gradient-to-b from-[#8042f6] to-[#6d28d9] text-white shadow-sm shadow-purple-500/20"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <img
              src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/cricket-ball.png"
              alt="Cricket"
              className={`w-4 h-4 object-contain ${activeTab === "cricket" ? "brightness-0 invert" : ""}`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${activeTab === "cricket" ? "" : "text-gray-500"}`}
            >
              Cricket
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 flex items-center justify-center gap-1.5 transition-all rounded-lg ${
              activeTab === "quiz"
                ? "bg-gradient-to-b from-[#8042f6] to-[#6d28d9] text-white shadow-sm shadow-purple-500/20"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <img
              src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/ideas.png"
              alt="Quiz"
              className={`w-4 h-4 object-contain ${activeTab === "quiz" ? "brightness-0 invert" : ""}`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${activeTab === "quiz" ? "" : "text-gray-500"}`}
            >
              Quiz
            </span>
          </button>
        </div>
      </div>

      {activeTab === "match" && renderMatch()}
      {activeTab === "cricket" && renderCricket()}
      {activeTab === "quiz" && renderQuiz()}

      {joinModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[340px] shadow-2xl relative">
            <h3 className="text-[18px] font-bold text-gray-900 mb-2 text-center">Join {joinModal.room?.game} Match</h3>
            <p className="text-[14px] text-gray-500 mb-6 text-center text-balance leading-relaxed">Enter your exact matching Game UID and Nickname below. If this is incorrect, you may be kicked from the custom room.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block ml-1 uppercase tracking-wider">Game UID</label>
                <input 
                  type="text" 
                  value={inGameUid}
                  onChange={(e) => setInGameUid(e.target.value)}
                  placeholder="e.g. 1957483829" 
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-purple-500 focus:bg-purple-50/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block ml-1 uppercase tracking-wider">In-Game Nickname</label>
                <input 
                  type="text" 
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  placeholder="e.g. OP_Killer_99" 
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-purple-500 focus:bg-purple-50/30 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setJoinModal({ show: false, room: null })}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-600 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinTournamentSubmit}
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#6D28D9] text-white active:scale-95 transition-transform shadow-md shadow-purple-500/20"
              >
                Confirm Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG Star Icon Helper for that specific look
function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
