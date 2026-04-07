"use client";

import { useGameStore } from "@/store/gameStore";

export default function Timer() {
  const timeLeft = useGameStore((s) => s.timeLeft);
  const gameStatus = useGameStore((s) => s.gameStatus);

  if (gameStatus !== "playing") return null;

  const pct = (timeLeft / 60) * 100;
  const color =
    timeLeft > 30
      ? "bg-green-500"
      : timeLeft > 10
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`font-bold text-lg tabular-nums min-w-[3ch] text-right ${
          timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-700"
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}
