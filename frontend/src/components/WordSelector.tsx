"use client";

import { useGameStore } from "@/store/gameStore";

interface WordSelectorProps {
  onSelect: (word: string) => void;
}

export default function WordSelector({ onSelect }: WordSelectorProps) {
  const wordOptions = useGameStore((s) => s.wordOptions);

  if (wordOptions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Te toca dibujar!
        </h2>
        <p className="text-gray-500 mb-6">Elige una palabra:</p>
        <div className="flex flex-col gap-3">
          {wordOptions.map((word) => (
            <button
              key={word}
              onClick={() => onSelect(word)}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-lg"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
