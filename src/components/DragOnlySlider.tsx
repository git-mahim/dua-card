"use client";

import React, { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface DragOnlySliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
}

export const DragOnlySlider: React.FC<DragOnlySliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Clamp helper
  const clamp = (val: number) => Math.min(max, Math.max(min, val));

  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handlePointerDownThumb = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Only handle primary pointer (left click or touch)
    if (e.button !== 0) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    triggerHaptic(30);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.stopPropagation();

    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    if (trackWidth <= 0) return;

    // Calculate current clientX relative to track left
    const currentX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, currentX / trackWidth));
    const rawVal = min + ratio * (max - min);

    // Round to step
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = clamp(steppedVal);

    if (clampedVal !== value) {
      triggerHaptic(15);
      onChange(clampedVal);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      triggerHaptic(30);
    }
  };

  const handleStepDown = () => {
    const next = clamp(value - step);
    if (next !== value) {
      triggerHaptic(20);
      onChange(next);
    }
  };

  const handleStepUp = () => {
    const next = clamp(value + step);
    if (next !== value) {
      triggerHaptic(20);
      onChange(next);
    }
  };

  return (
    <div className="flex items-center gap-2.5 w-full select-none no-select py-1">
      {/* Decrement Button */}
      <button
        type="button"
        onClick={handleStepDown}
        disabled={value <= min}
        aria-label="কমান"
        className="w-7 h-7 rounded-[8px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 border border-zinc-200/60 dark:border-zinc-700/60"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Track & Drag-Only Thumb */}
      <div
        ref={trackRef}
        className="relative flex-1 h-7 flex items-center touch-pan-y"
      >
        {/* Background Track (Tapping this DOES NOT jump the value during scroll) */}
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700/80 rounded-full overflow-hidden pointer-events-none">
          {/* Active Filled Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-[#ffb31a] to-[#e69c05] rounded-full transition-none"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Draggable Thumb Knob (Only dragging this horizontally changes the value) */}
        <div
          onPointerDown={handlePointerDownThumb}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          style={{
            left: `${percentage}%`,
            touchAction: "none",
          }}
          className={`absolute -translate-x-1/2 w-6 h-6 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform duration-75 ${
            isDragging
              ? "scale-125 ring-4 ring-[#ffb31a]/40 bg-[#ffb31a] shadow-md z-[2]"
              : "hover:scale-110 bg-white dark:bg-zinc-900 border-2 border-[#ffb31a] shadow-xs z-[1]"
          }`}
          title="ধরে ডানে-বামে টানুন"
        >
          {/* Inner Dot Indicator */}
          <div className="w-2 h-2 rounded-full bg-[#ffb31a] pointer-events-none" />
        </div>
      </div>

      {/* Increment Button */}
      <button
        type="button"
        onClick={handleStepUp}
        disabled={value >= max}
        aria-label="বাড়ান"
        className="w-7 h-7 rounded-[8px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 border border-zinc-200/60 dark:border-zinc-700/60"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
