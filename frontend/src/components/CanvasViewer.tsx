"use client";

import { Stage, Layer, Line } from "react-konva";
import { useGameStore } from "@/store/gameStore";

export default function CanvasViewer() {
  const strokes = useGameStore((s) => s.strokes);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200">
      <Stage width={800} height={600}>
        <Layer>
          {strokes.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === "eraser" ? "destination-out" : "source-over"
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
