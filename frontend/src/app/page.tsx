"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setError("Ingresa un nickname");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      sessionStorage.setItem("nickname", nickname.trim());
      sessionStorage.setItem("playerId", data.playerId);
      router.push(`/room/${data.roomCode}`);
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError("Ingresa un nickname");
      return;
    }
    if (!joinCode.trim()) {
      setError("Ingresa el código de la sala");
      return;
    }
    setError("");
    sessionStorage.setItem("nickname", nickname.trim());
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <Pencil size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Pictionary</h1>
          <p className="text-gray-500 mt-1">Dibuja y adivina con tus amigos</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tu Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ej: DibujanteMax"
            maxLength={20}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-lg rounded-xl transition-colors mb-4"
        >
          <Pencil size={20} />
          Crear Sala
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código de sala"
            maxLength={6}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800 font-mono tracking-widest text-center uppercase"
          />
          <button
            onClick={handleJoin}
            className="flex items-center gap-2 py-3 px-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
          >
            <Users size={18} />
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
}
