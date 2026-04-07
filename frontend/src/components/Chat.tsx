"use client";

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { Send } from "lucide-react";

interface ChatProps {
  onGuess: (text: string) => void;
}

export default function Chat({ onGuess }: ChatProps) {
  const [input, setInput] = useState("");
  const chatMessages = useGameStore((s) => s.chatMessages);
  const myId = useGameStore((s) => s.myId);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const hasGuessed = useGameStore((s) => s.hasGuessed);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isDrawer = myId === currentDrawerId;
  const canType = gameStatus === "playing" && !isDrawer && !hasGuessed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !canType) return;
    onGuess(text);
    setInput("");
  };

  return (
    <div className="bg-white rounded-xl shadow-md flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-800">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 min-h-0">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.isSystem
                ? msg.isCorrect
                  ? "text-green-600 font-semibold"
                  : "text-gray-400 italic"
                : "text-gray-700"
            }`}
          >
            {msg.isSystem ? (
              msg.text
            ) : (
              <>
                <span className="font-semibold text-indigo-600">
                  {msg.nickname}:
                </span>{" "}
                {msg.text}
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!canType}
            placeholder={
              isDrawer
                ? "Estás dibujando..."
                : hasGuessed
                  ? "¡Ya adivinaste!"
                  : gameStatus !== "playing"
                    ? "Esperando..."
                    : "Escribe tu adivinanza..."
            }
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!canType || !input.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
