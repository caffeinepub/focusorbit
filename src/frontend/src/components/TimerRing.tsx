import React from "react";

const TICK_INDICES = Array.from({ length: 60 }, (_, i) => i);

interface TimerRingProps {
  progress: number; // 0-1 (1 = full, 0 = empty)
  isRunning: boolean;
  mode: "focus" | "short_break" | "long_break";
  burstActive: boolean;
  themeColor?: string;
  children: React.ReactNode;
}

export function TimerRing({ progress, isRunning, mode, burstActive, themeColor, children }: TimerRingProps) {
  const size = 300;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const isFocus = mode === "focus";

  const ringColor = themeColor ?? (isFocus ? "#4fc3f7" : "#ffd54f");
  const glowColor = isFocus
    ? (themeColor ? `${themeColor}b3` : "rgba(79,195,247,0.7)")
    : "rgba(255,213,79,0.7)";

  const glowId = `glow-${mode}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Burst animation rings */}
      {burstActive && (
        <>
          <div
            className="absolute rounded-full border-2 animate-radial-burst"
            style={{
              width: size - 20,
              height: size - 20,
              borderColor: ringColor,
              opacity: 0.8,
            }}
          />
          <div
            className="absolute rounded-full border animate-radial-burst"
            style={{
              width: size - 20,
              height: size - 20,
              borderColor: ringColor,
              opacity: 0.5,
              animationDelay: "0.1s",
            }}
          />
        </>
      )}

      {/* Outer glow pulse when running */}
      {isRunning && (
        <div
          className="absolute rounded-full"
          style={{
            width: size - 10,
            height: size - 10,
            background: `radial-gradient(circle, ${glowColor.replace("0.7", "0.05")} 0%, transparent 70%)`,
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        />
      )}

      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        aria-label="Timer progress ring"
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
      >
        <title>Timer progress ring</title>
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Tick marks */}
        {TICK_INDICES.map((tickIdx) => {
          const angle = (tickIdx / 60) * 2 * Math.PI - Math.PI / 2;
          const isMajor = tickIdx % 5 === 0;
          const inner = radius - (isMajor ? 16 : 10);
          const outer = radius - (isMajor ? 6 : 4);
          const x1 = size / 2 + Math.cos(angle + Math.PI / 2) * inner;
          const y1 = size / 2 + Math.sin(angle + Math.PI / 2) * inner;
          const x2 = size / 2 + Math.cos(angle + Math.PI / 2) * outer;
          const y2 = size / 2 + Math.sin(angle + Math.PI / 2) * outer;
          return (
            <line
              key={`tick-${tickIdx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={isMajor ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={isRunning ? `url(#${glowId})` : undefined}
          style={{
            transition: "stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease",
          }}
        />

        {/* Endpoint dot */}
        {progress > 0.01 && (
          <circle
            cx={
              size / 2 +
              Math.cos(2 * Math.PI * progress - Math.PI / 2) * radius
            }
            cy={
              size / 2 +
              Math.sin(2 * Math.PI * progress - Math.PI / 2) * radius
            }
            r={strokeWidth / 2 + 1}
            fill={ringColor}
            filter={isRunning ? `url(#${glowId})` : undefined}
          />
        )}
      </svg>

      {/* Inner content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
