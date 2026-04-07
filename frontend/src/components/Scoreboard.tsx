"use client";

import { useGameStore } from "@/store/gameStore";
import { Trophy } from "lucide-react";

export default function Scoreboard() {
  const players = useGameStore((s) => s.players);
  const finalScores = useGameStore((s) => s.finalScores);
  const winnerId = useGameStore((s) => s.winnerId);
  const winnerNickname = useGameStore((s) => s.winnerNickname);

  const scores = Object.keys(finalScores).length > 0 ? finalScores : {};
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <Trophy size={48} className="text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          ¡Partida Terminada!
        </h1>
        <p className="text-lg text-indigo-600 font-semibold mb-6">
          🎉 {winnerNickname} gana!
        </p>

        <div className="space-y-3">
          {sorted.map(([pid, score], idx) => {
            const player = players[pid];
            const medal =
              idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
            return (
              <div
                key={pid}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  pid === winnerId
                    ? "bg-yellow-50 border-2 border-yellow-300"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{medal}</span>
                  <span className="font-semibold text-gray-700">
                    {player?.nickname ?? "???"}
                  </span>
                </div>
                <span className="font-bold text-lg text-indigo-600">
                  {score} pts
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
