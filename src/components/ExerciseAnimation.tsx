import React from "react";

interface ExerciseAnimationProps {
  exerciseName: string;
  isPlaying: boolean;
  isResting: boolean;
}

export default function ExerciseAnimation({ exerciseName, isPlaying, isResting }: ExerciseAnimationProps) {
  // Normalize exercise type
  const name = exerciseName ? exerciseName.toLowerCase() : "";
  let type: "chest" | "back" | "shoulders" | "biceps" | "triceps" | "legs" | "core" | "default" = "default";

  if (name.includes("سینه") || name.includes("فلای") || name.includes("دیپ")) {
    type = "chest";
  } else if (name.includes("زیربغل") || name.includes("بارفیکس") || name.includes("قایقی") || name.includes("ددلیفت") || name.includes("خم")) {
    type = "back";
  } else if (name.includes("سرشانه") || name.includes("نشر") || name.includes("کول")) {
    type = "shoulders";
  } else if (name.includes("جلو بازو") || name.includes("لاری")) {
    type = "biceps";
  } else if (name.includes("پشت بازو") || name.includes("سیم‌کش") || name.includes("سیم کش")) {
    type = "triceps";
  } else if (name.includes("اسکوات") || name.includes("ران") || name.includes("ساق") || name.includes("پا")) {
    type = "legs";
  } else if (name.includes("پلانک") || name.includes("شکم") || name.includes("کرانچ") || name.includes("خلبانی") || name.includes("فیله")) {
    type = "core";
  }

  // Define muscle highlights based on type
  const getMuscleHighlights = () => {
    switch (type) {
      case "chest":
        return { chest: true, triceps: true, shoulders: true };
      case "back":
        return { back: true, biceps: true };
      case "shoulders":
        return { shoulders: true, traps: true };
      case "biceps":
        return { biceps: true, forearms: true };
      case "triceps":
        return { triceps: true };
      case "legs":
        return { quads: true, hamstrings: true, calves: true, glutes: true };
      case "core":
        return { abs: true, lowerBack: true };
      default:
        return {};
    }
  };

  const highlights = getMuscleHighlights();
  const speedClass = isResting ? "paused" : isPlaying ? "running" : "paused";

  return (
    <div className="relative w-full h-full min-h-[160px] flex items-center justify-center bg-slate-950/80 rounded-2xl border border-white/5 p-4 overflow-hidden">
      <style>{`
        @keyframes bicepCurl {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-55deg); }
        }
        @keyframes benchPress {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(28px); }
        }
        @keyframes latPulldown {
          0%, 100% { transform: translateY(-15px); }
          50% { transform: translateY(20px); }
        }
        @keyframes sideRaise {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-60deg); }
        }
        @keyframes sideRaiseRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(60deg); }
        }
        @keyframes squatMove {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(18px) scaleY(0.85); }
        }
        @keyframes coreCrunch {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes musclePulse {
          0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 1px rgba(239, 68, 68, 0.4)); }
          50% { opacity: 0.95; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.95)); }
        }
        
        .anim-bicep {
          animation: bicepCurl 2.2s ease-in-out infinite;
          transform-origin: 100px 85px;
          animation-play-state: ${speedClass};
        }
        .anim-bench {
          animation: benchPress 2.4s ease-in-out infinite;
          animation-play-state: ${speedClass};
        }
        .anim-lat {
          animation: latPulldown 2.5s ease-in-out infinite;
          animation-play-state: ${speedClass};
        }
        .anim-raise-left {
          animation: sideRaise 2.2s ease-in-out infinite;
          transform-origin: 85px 65px;
          animation-play-state: ${speedClass};
        }
        .anim-raise-right {
          animation: sideRaiseRight 2.2s ease-in-out infinite;
          transform-origin: 115px 65px;
          animation-play-state: ${speedClass};
        }
        .anim-squat {
          animation: squatMove 2.6s ease-in-out infinite;
          transform-origin: 100px 140px;
          animation-play-state: ${speedClass};
        }
        .anim-crunch {
          animation: coreCrunch 2.2s ease-in-out infinite;
          transform-origin: 100px 110px;
          animation-play-state: ${speedClass};
        }
        .pulse-muscle {
          animation: musclePulse 1.5s ease-in-out infinite;
          animation-play-state: ${speedClass};
        }
      `}</style>

      {/* Muscle highlight visualization panel */}
      <div className="absolute top-2 left-2 bg-slate-900/90 border border-white/5 rounded-lg px-2 py-1 text-[8px] font-bold text-slate-400 space-y-0.5 z-10 select-none">
        <span className="block text-[7px] text-slate-500 uppercase">عضلات هدف فعال</span>
        <div className="flex flex-wrap gap-1 max-w-[120px]">
          {highlights.chest && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded">سینه</span>}
          {highlights.back && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">زیربغل</span>}
          {highlights.shoulders && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">سرشانه</span>}
          {highlights.biceps && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded">جلوبازو</span>}
          {highlights.triceps && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded">پشت‌بازو</span>}
          {highlights.quads && <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded">چهارسر</span>}
          {highlights.hamstrings && <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1 rounded">پشت‌ران</span>}
          {highlights.abs && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded">شکم</span>}
          {Object.keys(highlights).length === 0 && <span className="text-slate-500">پایه / فیتنس</span>}
        </div>
      </div>

      {/* SVG Canvas for interactive animation skeletal system */}
      <svg className="w-40 h-40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background grids */}
        <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
        <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />

        {/* 1. BICEPS CURL ANIMATION RIG */}
        {type === "biceps" && (
          <g>
            {/* Body base static */}
            <circle cx="100" cy="55" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" /> {/* Head */}
            <line x1="100" y1="69" x2="100" y2="120" stroke="#475569" strokeWidth="4" strokeLinecap="round" /> {/* Spine */}
            <line x1="80" y1="120" x2="120" y2="120" stroke="#334155" strokeWidth="3" /> {/* Hip */}
            <line x1="90" y1="120" x2="90" y2="175" stroke="#334155" strokeWidth="3" strokeLinecap="round" /> {/* Leg L */}
            <line x1="110" y1="120" x2="110" y2="175" stroke="#334155" strokeWidth="3" strokeLinecap="round" /> {/* Leg R */}

            {/* Torso & Shoulder */}
            <circle cx="100" cy="72" r="5" fill="#ef4444" className="pulse-muscle" /> {/* Chest/Heart */}

            {/* Left static arm holding body side */}
            <line x1="100" y1="75" x2="85" y2="85" stroke="#475569" strokeWidth="3" />
            <line x1="85" y1="85" x2="85" y2="110" stroke="#475569" strokeWidth="3" />

            {/* Right active arm doing Bicep Curl */}
            {/* Upper arm (Shoulder to Elbow) */}
            <line x1="100" y1="75" x2="100" y2="105" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            {/* Bicep Muscle overlay (glowing red during contraction) */}
            <path d="M98 80 Q93 92 98 105" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" className="pulse-muscle" />

            {/* Forearm (Elbow to Hand) with rotation animation */}
            <g className="anim-bicep">
              {/* Forearm bone */}
              <line x1="100" y1="105" x2="100" y2="140" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              {/* Dumbbell in hand */}
              <circle cx="100" cy="140" r="3" fill="#94a3b8" />
              <line x1="88" y1="140" x2="112" y2="140" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
              <rect x="85" y="136" width="4" height="8" fill="#1e293b" rx="1" />
              <rect x="111" y="136" width="4" height="8" fill="#1e293b" rx="1" />
            </g>
          </g>
        )}

        {/* 2. CHEST PRESS / BENCH PRESS RIG */}
        {type === "chest" && (
          <g>
            {/* Bench flat platform */}
            <line x1="40" y1="130" x2="160" y2="130" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <line x1="60" y1="130" x2="60" y2="170" stroke="#334155" strokeWidth="3" />
            <line x1="140" y1="130" x2="140" y2="170" stroke="#334155" strokeWidth="3" />

            {/* Athlete lying on bench (lying horizontally) */}
            <circle cx="65" cy="118" r="10" fill="#334155" stroke="#475569" strokeWidth="1.5" /> {/* Head */}
            <line x1="75" y1="122" x2="135" y2="122" stroke="#475569" strokeWidth="6" strokeLinecap="round" /> {/* Torso */}
            <line x1="135" y1="122" x2="155" y2="145" stroke="#334155" strokeWidth="3" strokeLinecap="round" /> {/* Legs bent down */}
            <line x1="155" y1="145" x2="155" y2="170" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Glowing Chest target */}
            <circle cx="95" cy="118" r="6" fill="#ef4444" className="pulse-muscle" />

            {/* Arms lifting Barbell */}
            {/* Left Upper Arm (Shoulder to Elbow) */}
            <line x1="90" y1="122" x2="82" y2="105" stroke="#475569" strokeWidth="3" />
            {/* Right Upper Arm (Shoulder to Elbow) */}
            <line x1="100" y1="122" x2="108" y2="105" stroke="#475569" strokeWidth="3" />

            {/* Barbell & weights moving vertically */}
            <g className="anim-bench">
              {/* Forearms supporting the bar */}
              <line x1="82" y1="105" x2="82" y2="80" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              <line x1="108" y1="105" x2="108" y2="80" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              
              {/* Barbell line */}
              <line x1="50" y1="80" x2="150" y2="80" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              {/* Left Plates */}
              <rect x="54" y="68" width="6" height="24" fill="#1e293b" rx="1.5" />
              <rect x="61" y="72" width="4" height="16" fill="#0f172a" rx="1" />
              {/* Right Plates */}
              <rect x="140" y="68" width="6" height="24" fill="#1e293b" rx="1.5" />
              <rect x="135" y="72" width="4" height="16" fill="#0f172a" rx="1" />
              
              {/* Safety collar rings */}
              <circle cx="67" cy="80" r="2" fill="#ef4444" />
              <circle cx="133" cy="80" r="2" fill="#ef4444" />
            </g>
          </g>
        )}

        {/* 3. LEGS SQUAT RIG */}
        {type === "legs" && (
          <g className="anim-squat">
            {/* Barbell resting on shoulders */}
            <g>
              <line x1="65" y1="58" x2="135" y2="58" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="68" y="48" width="6" height="20" fill="#1e293b" rx="1" />
              <rect x="75" y="52" width="4" height="12" fill="#0f172a" rx="1" />
              <rect x="126" y="48" width="6" height="20" fill="#1e293b" rx="1" />
              <rect x="121" y="52" width="4" height="12" fill="#0f172a" rx="1" />
            </g>

            {/* Athlete skeletal frame doing Squats */}
            <circle cx="100" cy="45" r="10" fill="#334155" stroke="#475569" strokeWidth="1.5" /> {/* Head */}
            <line x1="100" y1="55" x2="100" y2="105" stroke="#475569" strokeWidth="5" strokeLinecap="round" /> {/* Spine */}
            
            {/* Hip joints & thighs (Quads) */}
            <line x1="100" y1="105" x2="85" y2="135" stroke="#64748b" strokeWidth="4.5" strokeLinecap="round" /> {/* Left thigh */}
            <line x1="100" y1="105" x2="115" y2="135" stroke="#64748b" strokeWidth="4.5" strokeLinecap="round" /> {/* Right thigh */}

            {/* Quadriceps muscle highlight glowing */}
            <path d="M99 105 Q90 120 86 134" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="pulse-muscle" />
            <path d="M101 105 Q110 120 114 134" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="pulse-muscle" />

            {/* Lower Legs (Shin to ground) */}
            <line x1="85" y1="135" x2="88" y2="175" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="115" y1="135" x2="112" y2="175" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            
            {/* Feet */}
            <line x1="78" y1="175" x2="90" y2="175" stroke="#334155" strokeWidth="3.5" />
            <line x1="110" y1="175" x2="122" y2="175" stroke="#334155" strokeWidth="3.5" />
          </g>
        )}

        {/* 4. BACK / LAT PULLDOWN RIG */}
        {type === "back" && (
          <g>
            {/* Pulldown seat background */}
            <line x1="75" y1="120" x2="125" y2="120" stroke="#334155" strokeWidth="4" />
            <line x1="100" y1="120" x2="100" y2="175" stroke="#1e293b" strokeWidth="5" />

            {/* Athlete seated from rear angle */}
            <circle cx="100" cy="78" r="11" fill="#334155" stroke="#475569" strokeWidth="2" /> {/* Head */}
            <line x1="100" y1="89" x2="100" y2="130" stroke="#475569" strokeWidth="6.5" strokeLinecap="round" /> {/* Spine */}
            
            {/* Lats muscles (Back V-Taper highlight) */}
            <path d="M100 95 Q82 108 100 128" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2.5" className="pulse-muscle" />
            <path d="M100 95 Q118 108 100 128" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2.5" className="pulse-muscle" />

            {/* Pulldown bar moving down */}
            <g className="anim-lat">
              {/* Cable wire */}
              <line x1="100" y1="10" x2="100" y2="50" stroke="#475569" strokeWidth="1" />
              
              {/* Pulldown bar */}
              <line x1="45" y1="50" x2="155" y2="50" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
              <path d="M45 50 L40 55" stroke="#94a3b8" strokeWidth="3" />
              <path d="M155 50 L160 55" stroke="#94a3b8" strokeWidth="3" />

              {/* Arms reaching and gripping the bar */}
              {/* Left arm */}
              <line x1="88" y1="90" x2="70" y2="50" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              {/* Right arm */}
              <line x1="112" y1="90" x2="130" y2="50" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* 5. SHOULDERS SIDE LATERAL RAISE */}
        {type === "shoulders" && (
          <g>
            {/* Head and torso static */}
            <circle cx="100" cy="50" r="11" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="100" y1="61" x2="100" y2="125" stroke="#475569" strokeWidth="5.5" strokeLinecap="round" />
            
            {/* Legs */}
            <line x1="92" y1="125" x2="90" y2="175" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <line x1="108" y1="125" x2="110" y2="175" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Glowing Lateral Deltoids (Shoulders) */}
            <circle cx="86" cy="65" r="4.5" fill="#f59e0b" className="pulse-muscle" />
            <circle cx="114" cy="65" r="4.5" fill="#f59e0b" className="pulse-muscle" />

            {/* Left Arm side raise rotation */}
            <g className="anim-raise-left">
              <line x1="85" y1="65" x2="85" y2="110" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              {/* Dumbbell */}
              <circle cx="85" cy="110" r="2.5" fill="#94a3b8" />
              <line x1="76" y1="110" x2="94" y2="110" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Right Arm side raise rotation */}
            <g className="anim-raise-right">
              <line x1="115" y1="65" x2="115" y2="110" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
              {/* Dumbbell */}
              <circle cx="115" cy="110" r="2.5" fill="#94a3b8" />
              <line x1="106" y1="110" x2="124" y2="110" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* 6. CORE PLANK / CRUNCH RIG */}
        {type === "core" && (
          <g>
            {/* Floor mat */}
            <line x1="30" y1="150" x2="170" y2="150" stroke="#334155" strokeWidth="3.5" />

            {/* Plank simulation model */}
            <g className="anim-crunch">
              {/* Back & neck */}
              <circle cx="145" cy="120" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" /> {/* Head */}
              <line x1="135" y1="125" x2="70" y2="125" stroke="#475569" strokeWidth="6" strokeLinecap="round" /> {/* Spine */}
              
              {/* Forearm supporting core */}
              <line x1="125" y1="125" x2="125" y2="150" stroke="#64748b" strokeWidth="3" />
              <line x1="125" y1="150" x2="140" y2="150" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />

              {/* Legs extending back to floor */}
              <line x1="70" y1="125" x2="45" y2="148" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <line x1="45" y1="148" x2="48" y2="150" stroke="#334155" strokeWidth="3" />

              {/* Glowing Abs Core Muscle */}
              <rect x="90" y="123" width="22" height="6" rx="2" fill="#ef4444" className="pulse-muscle" />
            </g>
          </g>
        )}

        {/* 7. DEFAULT GENERAL STRETCH/HEALTH ANIMATION */}
        {type === "default" && (
          <g>
            {/* Basic dynamic yoga or stretch avatar */}
            <circle cx="100" cy="50" r="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="100" y1="62" x2="100" y2="120" stroke="#475569" strokeWidth="5" />
            
            {/* Dynamic circular arm loop */}
            <path d="M80 75 Q100 95 120 75" stroke="#3b82f6" strokeWidth="2.5" fill="none" className="pulse-muscle" />
            <circle cx="80" cy="75" r="3" fill="#cbd5e1" />
            <circle cx="120" cy="75" r="3" fill="#cbd5e1" />

            {/* Swaying legs */}
            <line x1="100" y1="120" x2="85" y2="168" stroke="#334155" strokeWidth="3" />
            <line x1="100" y1="120" x2="115" y2="168" stroke="#334155" strokeWidth="3" />
          </g>
        )}
      </svg>

      {/* Floating status display */}
      <div className="absolute bottom-2 right-2 text-[8px] text-slate-500 font-mono flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span>زنده (LIVE RIG)</span>
      </div>
    </div>
  );
}
