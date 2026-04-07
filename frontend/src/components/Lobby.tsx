"use client";

import { useGameStore } from "@/store/gameStore";
import { Copy, Play, Users } from "lucide-react";
import { useState } from "react";

interface LobbyProps {
  onStartGame: () => void;
}

export default function Lobby({ onStartGame }: LobbyProps) {
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const myId = useGameStore((s) => s.myId);
  const [copied, setCopied] = useState(false);

  const isHost = myId === hostId;
  const playerCount = Object.keys(players).length;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Sala de Espera
        </h1>
        <p className="text-gray-500 mb-6">Comparte el código con tus amigos</p>

        {/* Room code */}
        <div className="mb-6">
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-3xl font-bold px-6 py-3 rounded-xl transition-colors tracking-widest"
          >
            {roomCode}
            <Copy size={20} className="text-indigo-400" />
          </button>
          {copied && <p className="text-sm text-green-600 mt-1">¡Copiado!</p>}
        </div>

        {/* Player list */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
            <Users size={18} />
            <span className="font-medium">Jugadores ({playerCount})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.values(players).map((p) => (
              <span
                key={p.id}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  p.id === hostId
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {p.nickname}
                {p.id === hostId && " 👑"}
                {p.id === myId && " (tú)"}
              </span>
            ))}
          </div>
        </div>

        {/* Start button */}
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={playerCount < 2}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors"
          >
            <Play size={22} />
            Iniciar Partida
          </button>
        ) : (
          <p className="text-gray-400 text-sm">
            Esperando a que el host inicie la partida...
          </p>
        )}

        {playerCount < 2 && isHost && (
          <p className="text-sm text-orange-500 mt-2">
            Se necesitan al menos 2 jugadores
          </p>
        )}
      </div>
    </div>
  );
}
