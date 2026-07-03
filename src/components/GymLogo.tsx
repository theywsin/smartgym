import React from "react";

interface GymLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  isDark?: boolean;
  brandText?: string;
  themeColor?: string; // e.g. "emerald", "blue", "rose", "violet", "amber"
}

export default function GymLogo({ 
  className = "", 
  size = "md", 
  showText = true, 
  isDark = true,
  brandText,
  themeColor = "emerald"
}: GymLogoProps) {
  const sizeMap = {
    sm: { svg: "w-8 h-8", text: "text-base" },
    md: { svg: "w-11 h-11", text: "text-xl" },
    lg: { svg: "w-16 h-16", text: "text-2xl" },
    xl: { svg: "w-24 h-24", text: "text-4xl" }
  };

  const selectedSize = sizeMap[size];

  // Map theme name to hex colors for SVG gradients
  const getGradients = (color: string) => {
    switch (color) {
      case "blue":
        return { start: "#3B82F6", end: "#1D4ED8", accentStart: "#60A5FA", accentEnd: "#1E40AF" };
      case "rose":
        return { start: "#F43F5E", end: "#BE123C", accentStart: "#FB7185", accentEnd: "#9F1239" };
      case "violet":
        return { start: "#8B5CF6", end: "#6D28D9", accentStart: "#A78BFA", accentEnd: "#5B21B6" };
      case "amber":
        return { start: "#F59E0B", end: "#B45309", accentStart: "#FBBF24", accentEnd: "#92400E" };
      default: // "emerald"
        return { start: "#10B981", end: "#059669", accentStart: "#34D399", accentEnd: "#047857" };
    }
  };

  const grads = getGradients(themeColor);

  const getThemeTextClass = (color: string) => {
    switch (color) {
      case "blue": return "text-blue-500";
      case "rose": return "text-rose-500";
      case "violet": return "text-violet-500";
      case "amber": return "text-amber-500";
      default: return "text-emerald-500";
    }
  };

  const textAccentClass = getThemeTextClass(themeColor);

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} dir="rtl">
      {/* Dynamic Athletic Logo */}
      <div className={`relative shrink-0 ${selectedSize.svg} transition-transform duration-300 hover:scale-105`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-current opacity-20 blur-lg rounded-full" style={{ color: grads.start }}></div>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`logo-grad-${themeColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={grads.start} />
              <stop offset="100%" stopColor={grads.end} />
            </linearGradient>
            <linearGradient id={`logo-accent-grad-${themeColor}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={grads.accentStart} />
              <stop offset="100%" stopColor={grads.accentEnd} />
            </linearGradient>
          </defs>

          {/* Minimal Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            stroke={`url(#logo-grad-${themeColor})`} 
            strokeWidth="7" 
            strokeLinecap="round"
            strokeDasharray="180 50"
          />

          {/* Minimal Dumbbell */}
          <path 
            d="M38 50H62 M38 42V58 M62 42V58" 
            stroke={`url(#logo-accent-grad-${themeColor})`} 
            strokeWidth="9" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Tech dot */}
          <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          {brandText ? (
            <span className={`font-black tracking-tight ${selectedSize.text} ${isDark ? "text-slate-100" : "text-slate-900"} leading-none`}>
              {brandText}
            </span>
          ) : (
            <span className={`font-black tracking-tight ${selectedSize.text} ${isDark ? "text-slate-100" : "text-slate-900"} leading-none`}>
              اسمارت <span className={`${textAccentClass} font-extrabold`}>جیم</span>
            </span>
          )}
          <span className="text-[9px] font-bold tracking-widest text-slate-500 font-mono mt-0.5 leading-none uppercase">
            SMARTGYM SaaS
          </span>
        </div>
      )}
    </div>
  );
}
