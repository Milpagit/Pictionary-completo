"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGameStore } from "@/store/gameStore";
import dynamic from "next/dynamic";
import type { Stroke } from "@/lib/types";

import PlayerList from "@/components/PlayerList";
import Chat from "@/components/Chat";
import Timer from "@/components/Timer";
import ToolBar from "@/components/ToolBar";
import WordSelector from "@/components/WordSelector";
import Lobby from "@/components/Lobby";
import Scoreboard from "@/components/Scoreboard";

// react-konva must be client-only (no SSR)
const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });
const CanvasViewer = dynamic(() => import("@/components/CanvasViewer"), {
  ssr: false,
});

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  // Drawing tools state
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState("pen");

  // Ref to Canvas clear function
  const canvasClearRef = useRef<(() => void) | null>(null);

  const gameStatus = useGameStore((s) => s.gameStatus);
  const myId = useGameStore((s) => s.myId);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const wordLength = useGameStore((s) => s.wordLength);
  const hint = useGameStore((s) => s.hint);
  const wordOptions = useGameStore((s) => s.wordOptions);
  const revealedWord = useGameStore((s) => s.revealedWord);
  const players = useGameStore((s) => s.players);

  useEffect(() => {
    const stored = sessionStorage.getItem("nickname");
    if (!stored) {
      router.push("/");
      return;
    }
    setNickname(stored);
  }, [router]);

  const { sendMessage } = useWebSocket(code, nickname);

  const isDrawer = myId === currentDrawerId;

  const handleStartGame = useCallback(() => {
    sendMessage({ type: "start_game" });
  }, [sendMessage]);

  const handleSelectWord = useCallback(
    (word: string) => {
      sendMessage({ type: "select_word", word });
    },
    [sendMessage],
  );

  const handleDraw = useCallback(
    (stroke: Stroke) => {
      sendMessage({
        type: "draw",
        points: stroke.points,
        color: stroke.color,
        strokeWidth: stroke.strokeWidth,
        tool: stroke.tool,
      });
    },
    [sendMessage],
  );

  const handleClearCanvas = useCallback(() => {
    sendMessage({ type: "clear_canvas" });
  }, [sendMessage]);

  const handleGuess = useCallback(
    (text: string) => {
      sendMessage({ type: "guess", text });
    },
    [sendMessage],
  );

  if (!nickname) return null;

  // Game finished → show scoreboard
  if (gameStatus === "finished") {
    return <Scoreboard />;
  }

  // Waiting → show lobby
  if (gameStatus === "waiting") {
    return <Lobby onStartGame={handleStartGame} />;
  }

  // Playing or choosing or round_end → show game UI
  const drawerName = players[currentDrawerId]?.nickname ?? "???";

  const wordDisplay =
    gameStatus === "round_end"
      ? revealedWord
      : hint
        ? hint
        : wordLength > 0
          ? "_ ".repeat(wordLength).trim()
          : "";

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header bar */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white rounded-xl shadow-md px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Ronda{" "}
              <span className="font-bold text-gray-800">{currentRound}</span>/
              {totalRounds}
            </span>
            {gameStatus === "choosing" && (
              <span className="text-sm text-yellow-600 font-medium">
                {isDrawer
                  ? "¡Elige una palabra!"
                  : `${drawerName} está eligiendo...`}
              </span>
            )}
            {gameStatus === "round_end" && (
              <span className="text-sm text-indigo-600 font-medium">
                Siguiente ronda en breve...
              </span>
            )}
          </div>

          {/* Word / hint display */}
          <div className="font-mono text-2xl tracking-[0.3em] font-bold text-gray-800">
            {wordDisplay}
          </div>

          {/* Timer */}
          <div className="w-48">
            <Timer />
          </div>
        </div>
      </div>

      {/* Main game layout */}
      <div className="max-w-7xl mx-auto flex gap-4 h-[calc(100vh-140px)]">
        {/* Left: Player list */}
        <div className="w-56 shrink-0">
          <PlayerList />
        </div>

        {/* Center: Canvas + Toolbar */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 flex items-center justify-center">
            {isDrawer && gameStatus === "playing" ? (
              <Canvas
                onDraw={handleDraw}
                onClear={handleClearCanvas}
                color={color}
                strokeWidth={strokeWidth}
                tool={tool}
              />
            ) : (
              <CanvasViewer />
            )}
          </div>

          {isDrawer && gameStatus === "playing" && (
            <ToolBar
              color={color}
              strokeWidth={strokeWidth}
              tool={tool}
              onColorChange={setColor}
              onStrokeWidthChange={setStrokeWidth}
              onToolChange={setTool}
              onClear={() => {
                handleClearCanvas();
                // Also clear local canvas — we'll use a ref pattern
                canvasClearRef.current?.();
              }}
            />
          )}
        </div>

        {/* Right: Chat */}
        <div className="w-72 shrink-0">
          <Chat onGuess={handleGuess} />
        </div>
      </div>

      {/* Word selector modal (only for drawer) */}
      {isDrawer && wordOptions.length > 0 && (
        <WordSelector onSelect={handleSelectWord} />
      )}
    </div>
  );
}
