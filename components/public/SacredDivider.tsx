import React from "react";

interface SacredDividerProps {
  className?: string;
  variant?: "gold" | "maroon" | "subtle";
}

export default function SacredDivider({
  className = "",
  variant = "gold",
}: SacredDividerProps) {
  const colorMap = {
    gold: "text-gold-royal/80 border-gold-royal/30",
    maroon: "text-maroon-primary/80 border-maroon-primary/30",
    subtle: "text-stone-400 border-stone-200",
  };

  return (
    <div className={`flex items-center justify-center gap-3 my-4 ${className}`} aria-hidden="true">
      <div className={`h-px w-12 sm:w-20 border-t ${colorMap[variant]}`} />
      <span className={`text-xs select-none ${colorMap[variant].split(" ")[0]}`}>✦</span>
      <div className={`h-px w-12 sm:w-20 border-t ${colorMap[variant]}`} />
    </div>
  );
}
