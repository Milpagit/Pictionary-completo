// ---- Player ----
export interface Player {
  id: string;
  nickname: string;
  score: number;
}

// ---- Game status ----
export type GameStatus =
  | "waiting"
  | "choosing"
  | "playing"
  | "round_end"
  | "finished";

// ---- Incoming WS messages (server → client) ----

export interface RoomStateMsg {
  type: "room_state";
  roomCode: string;
  playerId: string;
  hostId: string;
  players: Record<string, Player>;
  status: string;
}

export interface PlayerJoinedMsg {
  type: "player_joined";
  player: Player;
  players: Record<string, Player>;
  hostId: string;
}

export interface PlayerLeftMsg {
  type: "player_left";
  playerId: string;
  hostId: string;
  players: Record<string, Player>;
}

export interface GameStartedMsg {
  type: "game_started";
  totalRounds: number;
  turnOrder: string[];
}

export interface WordOptionsMsg {
  type: "word_options";
  words: string[];
}

export interface ChoosingWordMsg {
  type: "choosing_word";
  drawerId: string;
  round: number;
}

export interface RoundStartMsg {
  type: "round_start";
  drawerId: string;
  wordLength: number;
  round: number;
  timeLeft: number;
}

export interface DrawMsg {
  type: "draw";
  points: number[];
  color: string;
  strokeWidth: number;
  tool: string;
}

export interface ClearCanvasMsg {
  type: "clear_canvas";
}

export interface GuessMessageMsg {
  type: "guess_message";
  playerId: string;
  nickname: string;
  text: string;
}

export interface CorrectGuessMsg {
  type: "correct_guess";
  playerId: string;
  nickname: string;
  points: number;
  scores: Record<string, number>;
}

export interface HintMsg {
  type: "hint";
  hint: string;
}

export interface TimeUpdateMsg {
  type: "time_update";
  timeLeft: number;
}

export interface RoundEndMsg {
  type: "round_end";
  word: string;
  scores: Record<string, number>;
  round: number;
}

export interface GameEndMsg {
  type: "game_end";
  finalScores: Record<string, number>;
  winnerId: string;
  winnerNickname: string;
}

export interface ErrorMsg {
  type: "error";
  message: string;
}

export type ServerMessage =
  | RoomStateMsg
  | PlayerJoinedMsg
  | PlayerLeftMsg
  | GameStartedMsg
  | WordOptionsMsg
  | ChoosingWordMsg
  | RoundStartMsg
  | DrawMsg
  | ClearCanvasMsg
  | GuessMessageMsg
  | CorrectGuessMsg
  | HintMsg
  | TimeUpdateMsg
  | RoundEndMsg
  | GameEndMsg
  | ErrorMsg;

// ---- Chat message (UI) ----
export interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  isSystem: boolean;
  isCorrect: boolean;
}

// ---- Stroke (drawing line) ----
export interface Stroke {
  points: number[];
  color: string;
  strokeWidth: number;
  tool: string;
}
