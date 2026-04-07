import { create } from "zustand";
import type { ChatMessage, GameStatus, Player, Stroke } from "@/lib/types";

interface GameState {
  // Connection
  roomCode: string;
  myId: string;
  hostId: string;
  connected: boolean;

  // Players
  players: Record<string, Player>;

  // Game
  gameStatus: GameStatus;
  currentDrawerId: string;
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  wordLength: number;
  hint: string;
  wordOptions: string[];
  revealedWord: string;

  // Guessing
  hasGuessed: boolean;

  // Chat
  chatMessages: ChatMessage[];

  // Canvas
  strokes: Stroke[];

  // Final
  finalScores: Record<string, number>;
  winnerId: string;
  winnerNickname: string;

  // Actions
  setConnection: (roomCode: string, myId: string, hostId: string) => void;
  setConnected: (v: boolean) => void;
  setPlayers: (players: Record<string, Player>) => void;
  setHostId: (id: string) => void;
  setGameStatus: (s: GameStatus) => void;
  setCurrentDrawer: (id: string) => void;
  setRound: (round: number, total?: number) => void;
  setTimeLeft: (t: number) => void;
  setWordLength: (l: number) => void;
  setHint: (h: string) => void;
  setWordOptions: (w: string[]) => void;
  setRevealedWord: (w: string) => void;
  setHasGuessed: (v: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addStroke: (s: Stroke) => void;
  clearStrokes: () => void;
  updateScores: (scores: Record<string, number>) => void;
  setFinalResults: (
    scores: Record<string, number>,
    winnerId: string,
    winnerNickname: string,
  ) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: "",
  myId: "",
  hostId: "",
  connected: false,
  players: {},
  gameStatus: "waiting",
  currentDrawerId: "",
  currentRound: 0,
  totalRounds: 0,
  timeLeft: 0,
  wordLength: 0,
  hint: "",
  wordOptions: [],
  revealedWord: "",
  hasGuessed: false,
  chatMessages: [],
  strokes: [],
  finalScores: {},
  winnerId: "",
  winnerNickname: "",

  setConnection: (roomCode, myId, hostId) => set({ roomCode, myId, hostId }),
  setConnected: (connected) => set({ connected }),
  setPlayers: (players) => set({ players }),
  setHostId: (hostId) => set({ hostId }),
  setGameStatus: (gameStatus) => set({ gameStatus }),
  setCurrentDrawer: (currentDrawerId) => set({ currentDrawerId }),
  setRound: (currentRound, totalRounds) =>
    set((s) => ({ currentRound, totalRounds: totalRounds ?? s.totalRounds })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setWordLength: (wordLength) => set({ wordLength }),
  setHint: (hint) => set({ hint }),
  setWordOptions: (wordOptions) => set({ wordOptions }),
  setRevealedWord: (revealedWord) => set({ revealedWord }),
  setHasGuessed: (hasGuessed) => set({ hasGuessed }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  clearStrokes: () => set({ strokes: [] }),
  updateScores: (scores) =>
    set((s) => {
      const players = { ...s.players };
      for (const [pid, score] of Object.entries(scores)) {
        if (players[pid]) players[pid] = { ...players[pid], score };
      }
      return { players };
    }),
  setFinalResults: (finalScores, winnerId, winnerNickname) =>
    set({ finalScores, winnerId, winnerNickname, gameStatus: "finished" }),
  resetGame: () =>
    set({
      gameStatus: "waiting",
      currentDrawerId: "",
      currentRound: 0,
      totalRounds: 0,
      timeLeft: 0,
      wordLength: 0,
      hint: "",
      wordOptions: [],
      revealedWord: "",
      hasGuessed: false,
      chatMessages: [],
      strokes: [],
      finalScores: {},
      winnerId: "",
      winnerNickname: "",
    }),
}));
