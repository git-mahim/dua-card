"use client";

import React, { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface DoubleTapCheckAnimationProps {
  show: boolean;
  onAnimationEnd?: () => void;
  onComplete?: () => void;
}

export const DoubleTapCheckAnimation: React.FC<DoubleTapCheckAnimationProps> = ({
  show,
  onAnimationEnd,
  onComplete,
}) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onAnimationEnd?.();
        onComplete?.();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [show, onAnimationEnd, onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden rounded-2xl">
      <div className="relative flex flex-col items-center justify-center animate-in zoom-in-50 fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[#ffb31a] text-zinc-950 shadow-xl shadow-[#ffb31a]/40 flex items-center justify-center transform scale-110">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>
        <Sparkles className="w-6 h-6 text-[#ffb31a] absolute -top-2 -right-2 animate-bounce" />
        <span className="mt-2 px-3 py-1 bg-black/80 text-[#ffb31a] text-xs font-bold rounded-full shadow-md backdrop-blur-sm flex items-center justify-center leading-none">
          <span className="translate-y-[0.5px]">
            {language === "bn" ? "পড়েছি!" : "Completed!"}
          </span>
        </span>
      </div>
    </div>
  );
};
