"use client";

import { Paintbrush, Eraser, Trash2 } from "lucide-react";

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#808080",
  "#FF0000",
  "#FF6600",
  "#FFFF00",
  "#00CC00",
  "#0066FF",
  "#9900FF",
  "#FF69B4",
  "#8B4513",
  "#00CCCC",
];

const STROKE_WIDTHS = [
  { label: "S", value: 3 },
  { label: "M", value: 8 },
  { label: "L", value: 16 },
];

interface ToolBarProps {
  color: string;
  strokeWidth: number;
  tool: string;
  onColorChange: (c: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onToolChange: (t: string) => void;
  onClear: () => void;
}

export default function ToolBar({
  color,
  strokeWidth,
  tool,
  onColorChange,
  onStrokeWidthChange,
  onToolChange,
  onClear,
}: ToolBarProps) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl shadow-md px-4 py-3 flex-wrap">
      {/* Colors */}
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              onColorChange(c);
              onToolChange("pen");
            }}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              color === c && tool === "pen"
                ? "border-indigo-500 scale-110"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Stroke widths */}
      <div className="flex gap-1.5">
        {STROKE_WIDTHS.map((sw) => (
          <button
            key={sw.value}
            onClick={() => onStrokeWidthChange(sw.value)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
              strokeWidth === sw.value
                ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {sw.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Tools */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onToolChange("pen")}
          className={`p-2 rounded-lg transition-colors ${
            tool === "pen"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Paintbrush size={20} />
        </button>
        <button
          onClick={() => onToolChange("eraser")}
          className={`p-2 rounded-lg transition-colors ${
            tool === "eraser"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Eraser size={20} />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
