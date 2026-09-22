"use client";

import React from "react";

function BlossomTreeIllustration() {
  return (
    <svg
      viewBox="0 0 400 340"
      className="w-64 h-56 sm:w-80 sm:h-72"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground */}
      <ellipse cx="200" cy="322" rx="130" ry="12" fill="rgba(232,109,176,0.08)" />

      {/* Trunk */}
      <path
        d="M200 320
           C196 280 210 250 198 220
           C188 195 212 175 202 150
           C195 130 210 115 200 95"
        stroke="#3a2230"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      {/* Branches */}
      <path
        d="M202 150 C170 140 150 120 140 95"
        stroke="#3a2230"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M198 190 C230 178 250 155 258 130"
        stroke="#3a2230"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M200 95 C185 75 190 55 175 40"
        stroke="#3a2230"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M200 95 C215 78 215 55 232 42"
        stroke="#3a2230"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blossom clusters */}
      {[
        { cx: 145, cy: 90, r: 42 },
        { cx: 200, cy: 60, r: 48 },
        { cx: 255, cy: 95, r: 40 },
        { cx: 130, cy: 130, r: 34 },
        { cx: 270, cy: 135, r: 32 },
        { cx: 195, cy: 115, r: 38 },
      ].map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="url(#blossomGradient)"
          opacity={0.9}
        />
      ))}

      <defs>
        <radialGradient id="blossomGradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffd9ec" />
          <stop offset="55%" stopColor="#f6a8cf" />
          <stop offset="100%" stopColor="#e86db0" />
        </radialGradient>
      </defs>

      {/* Falling petals — animated in SVG user-space units (not vh, since
          this lives inside a scaled viewBox) */}
      {[...Array(6)].map((_, i) => (
        <circle
          key={`petal-${i}`}
          cx={120 + i * 30}
          cy={-10}
          r={4}
          fill="#ffb7d5"
          className="maintenance-petal"
          style={{
            animationDuration: `${4 + i}s`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </svg>
  );
}

type Props = {
  message?: string;
};

function MaintenancePage({ message }: Props) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0d0d12] text-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(232,109,176,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <BlossomTreeIllustration />

        <h1 className="mt-6 font-display text-3xl sm:text-4xl font-black blossom-text">
          We are currently tending to the blossoms 🌸
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md">
          {message ||
            "AniBlossom is down for a little maintenance. We'll be back in bloom shortly — thanks for your patience."}
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/70">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{
                background: "#e86db0",
                animation: "livePulse 1.6s ease-out infinite",
              }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blossom-pink" />
          </span>
          Working on it now
        </div>
      </div>
    </div>
  );
}

export default MaintenancePage;
