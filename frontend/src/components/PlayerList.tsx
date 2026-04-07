"use client";

import { useGameStore } from "@/store/gameStore";
import { Users, Crown } from "lucide-react";

export default function PlayerList() {
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const myId = useGameStore((s) => s.myId);

  const sorted = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-indigo-600" />
        <h2 className="font-bold text-gray-800">Jugadores ({sorted.length})</h2>
      </div>
      <ul className="space-y-2">
        {sorted.map((p) => (
          <li
            key={p.id}
            className={`flex items-center justify-between p-2 rounded-lg text-sm ${
              p.id === currentDrawerId
                ? "bg-yellow-50 border border-yellow-300"
                : p.id === myId
                  ? "bg-indigo-50 border border-indigo-200"
                  : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {p.id === hostId && (
                <Crown size={14} className="text-yellow-500 shrink-0" />
              )}
              <span className="truncate font-medium">
                {p.nickname}
                {p.id === myId && " (tú)"}
              </span>
              {p.id === currentDrawerId && (
                <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full shrink-0">
                  🎨
                </span>
              )}
            </div>
            <span className="font-bold text-indigo-600 shrink-0 ml-2">
              {p.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
