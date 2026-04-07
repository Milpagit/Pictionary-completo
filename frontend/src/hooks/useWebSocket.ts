"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import type { ServerMessage } from "@/lib/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWebSocket(roomCode: string, nickname: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useGameStore();

  useEffect(() => {
    if (!roomCode || !nickname) return;

    const url = `${WS_BASE}/ws/${roomCode}/${encodeURIComponent(nickname)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      store.setConnected(true);
    };

    ws.onclose = () => {
      store.setConnected(false);
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      handleMessage(msg);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, nickname]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    const s = useGameStore.getState();

    switch (msg.type) {
      case "room_state":
        s.setConnection(msg.roomCode, msg.playerId, msg.hostId);
        s.setPlayers(msg.players);
        break;

      case "player_joined":
        s.setPlayers(msg.players);
        s.setHostId(msg.hostId);
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: `${msg.player.nickname} se unió a la sala`,
          isSystem: true,
          isCorrect: false,
        });
        break;

      case "player_left":
        s.setPlayers(msg.players);
        s.setHostId(msg.hostId);
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: `Un jugador abandonó la sala`,
          isSystem: true,
          isCorrect: false,
        });
        break;

      case "game_started":
        s.setGameStatus("choosing");
        s.setRound(0, msg.totalRounds);
        s.clearStrokes();
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: "¡La partida ha comenzado!",
          isSystem: true,
          isCorrect: false,
        });
        break;

      case "word_options":
        s.setWordOptions(msg.words);
        break;

      case "choosing_word":
        s.setGameStatus("choosing");
        s.setCurrentDrawer(msg.drawerId);
        s.setRound(msg.round);
        s.setHint("");
        s.setHasGuessed(false);
        s.clearStrokes();
        break;

      case "round_start":
        s.setGameStatus("playing");
        s.setCurrentDrawer(msg.drawerId);
        s.setWordLength(msg.wordLength);
        s.setTimeLeft(msg.timeLeft);
        s.setRound(msg.round);
        s.setWordOptions([]);
        s.setHint("");
        s.setRevealedWord("");
        s.setHasGuessed(false);
        s.clearStrokes();
        break;

      case "draw":
        s.addStroke({
          points: msg.points,
          color: msg.color,
          strokeWidth: msg.strokeWidth,
          tool: msg.tool,
        });
        break;

      case "clear_canvas":
        s.clearStrokes();
        break;

      case "guess_message":
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: msg.nickname,
          text: msg.text,
          isSystem: false,
          isCorrect: false,
        });
        break;

      case "correct_guess":
        s.updateScores(msg.scores);
        if (msg.playerId === s.myId) {
          s.setHasGuessed(true);
        }
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: `🎉 ${msg.nickname} adivinó la palabra! (+${msg.points} pts)`,
          isSystem: true,
          isCorrect: true,
        });
        break;

      case "hint":
        s.setHint(msg.hint);
        break;

      case "time_update":
        s.setTimeLeft(msg.timeLeft);
        break;

      case "round_end":
        s.setGameStatus("round_end");
        s.setRevealedWord(msg.word);
        s.updateScores(msg.scores);
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: `La palabra era: "${msg.word}"`,
          isSystem: true,
          isCorrect: false,
        });
        break;

      case "game_end":
        s.setFinalResults(msg.finalScores, msg.winnerId, msg.winnerNickname);
        break;

      case "error":
        s.addChatMessage({
          id: crypto.randomUUID(),
          nickname: "",
          text: `Error: ${msg.message}`,
          isSystem: true,
          isCorrect: false,
        });
        break;
    }
  }, []);

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendMessage };
}
