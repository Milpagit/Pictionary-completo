"use client";

import { useRef, useState, useCallback } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stroke } from "@/lib/types";

interface CanvasProps {
  onDraw: (stroke: Stroke) => void;
  onClear: () => void;
  color: string;
  strokeWidth: number;
  tool: string;
  disabled?: boolean;
}

export default function Canvas({
  onDraw,
  onClear,
  color,
  strokeWidth,
  tool,
  disabled = false,
}: CanvasProps) {
  const [lines, setLines] = useState<Stroke[]>([]);
  const isDrawing = useRef(false);
  const currentLine = useRef<number[]>([]);
  const stageRef = useRef<any>(null);

  const getPointerPos = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return null;
    return stage.getPointerPosition();
  };

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (disabled) return;
      isDrawing.current = true;
      const pos = getPointerPos(e);
      if (!pos) return;
      currentLine.current = [pos.x, pos.y];
    },
    [disabled],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing.current || disabled) return;
      const pos = getPointerPos(e);
      if (!pos) return;
      currentLine.current = [...currentLine.current, pos.x, pos.y];

      const stroke: Stroke = {
        points: [...currentLine.current],
        color: tool === "eraser" ? "#FFFFFF" : color,
        strokeWidth,
        tool,
      };

      setLines((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && isDrawing.current) {
          updated[updated.length - 1] = stroke;
        } else {
          updated.push(stroke);
        }
        return updated;
      });
    },
    [color, strokeWidth, tool, disabled],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentLine.current.length >= 4) {
      const stroke: Stroke = {
        points: [...currentLine.current],
        color: tool === "eraser" ? "#FFFFFF" : color,
        strokeWidth,
        tool,
      };
      onDraw(stroke);
    }
    currentLine.current = [];
  }, [color, strokeWidth, tool, onDraw]);

  const handleClear = useCallback(() => {
    setLines([]);
    onClear();
  }, [onClear]);

  // Expose clear to parent via ref-like callback
  (Canvas as any)._clearFn = handleClear;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200">
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
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
