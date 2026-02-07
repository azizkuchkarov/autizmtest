"use client";

import React from "react";

type NatureType = "happy" | "excited" | "thinking" | "celebrating" | "sleeping" | "waving";

interface NatureProps {
  type?: NatureType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Dino({ type = "happy", size = "md", className = "" }: NatureProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const getNatureSVG = () => {
    switch (type) {
      case "happy":
        // Gentle sun with soft rays
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#fef3c7" opacity="0.3" />
            {/* Sun center */}
            <circle cx="50" cy="50" r="18" fill="#fbbf24" />
            {/* Soft rays */}
            <path d="M 50 20 L 50 15" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 50 80 L 50 85" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 20 50 L 15 50" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 80 50 L 85 50" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 35 35 L 30 30" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 65 35 L 70 30" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 35 65 L 30 70" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M 65 65 L 70 70" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            {/* Face */}
            <circle cx="46" cy="46" r="2" fill="#1e293b" />
            <circle cx="54" cy="46" r="2" fill="#1e293b" />
            <path d="M 44 54 Q 50 58 56 54" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      case "excited":
        // Blooming flower
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#fce7f3" opacity="0.3" />
            {/* Petals */}
            <ellipse cx="50" cy="40" rx="12" ry="18" fill="#f472b6" transform="rotate(0 50 50)" />
            <ellipse cx="50" cy="40" rx="12" ry="18" fill="#ec4899" transform="rotate(45 50 50)" />
            <ellipse cx="50" cy="40" rx="12" ry="18" fill="#f472b6" transform="rotate(90 50 50)" />
            <ellipse cx="50" cy="40" rx="12" ry="18" fill="#ec4899" transform="rotate(135 50 50)" />
            {/* Center */}
            <circle cx="50" cy="50" r="8" fill="#fbbf24" />
            <circle cx="50" cy="50" r="5" fill="#f59e0b" />
            {/* Stem */}
            <path d="M 50 58 L 50 75" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            {/* Leaf */}
            <ellipse cx="45" cy="65" rx="6" ry="3" fill="#16a34a" transform="rotate(-30 45 65)" />
          </svg>
        );
      case "thinking":
        // Gentle cloud
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#e0e7ff" opacity="0.3" />
            {/* Cloud shape */}
            <ellipse cx="45" cy="50" rx="15" ry="12" fill="#c7d2fe" />
            <ellipse cx="55" cy="50" rx="15" ry="12" fill="#c7d2fe" />
            <ellipse cx="50" cy="45" rx="18" ry="14" fill="#c7d2fe" />
            <ellipse cx="40" cy="52" rx="12" ry="10" fill="#a5b4fc" />
            <ellipse cx="60" cy="52" rx="12" ry="10" fill="#a5b4fc" />
            {/* Thought bubbles */}
            <circle cx="70" cy="35" r="4" fill="#818cf8" opacity="0.5" />
            <circle cx="75" cy="30" r="3" fill="#818cf8" opacity="0.4" />
            <circle cx="80" cy="25" r="2" fill="#818cf8" opacity="0.3" />
          </svg>
        );
      case "celebrating":
        // Rainbow with stars
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#fef3c7" opacity="0.3" />
            {/* Rainbow arcs */}
            <path d="M 25 60 Q 50 40 75 60" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 28 60 Q 50 43 72 60" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 31 60 Q 50 46 69 60" stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 34 60 Q 50 49 66 60" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 37 60 Q 50 52 63 60" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 40 60 Q 50 55 60 60" stroke="#6366f1" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Stars */}
            <path d="M 20 30 L 22 35 L 27 35 L 23 38 L 25 43 L 20 40 L 15 43 L 17 38 L 13 35 L 18 35 Z" fill="#fbbf24" />
            <path d="M 80 30 L 82 35 L 87 35 L 83 38 L 85 43 L 80 40 L 75 43 L 77 38 L 73 35 L 78 35 Z" fill="#fbbf24" />
            <path d="M 50 20 L 51 23 L 54 23 L 52 25 L 53 28 L 50 26 L 47 28 L 48 25 L 46 23 L 49 23 Z" fill="#fbbf24" />
          </svg>
        );
      case "sleeping":
        // Moon with stars
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#e0e7ff" opacity="0.2" />
            {/* Moon */}
            <circle cx="50" cy="50" r="20" fill="#fbbf24" />
            {/* Moon shadow */}
            <circle cx="55" cy="48" r="18" fill="#f3f4f6" />
            {/* Face - sleeping */}
            <path d="M 45 48 Q 48 46 51 48" stroke="#1e293b" strokeWidth="2" fill="none" />
            <path d="M 49 48 Q 51 46 53 48" stroke="#1e293b" strokeWidth="2" fill="none" />
            {/* Zzz */}
            <text x="65" y="45" fontSize="10" fill="#6366f1" fontWeight="bold">Z</text>
            <text x="70" y="40" fontSize="8" fill="#6366f1" fontWeight="bold">z</text>
            {/* Small stars */}
            <circle cx="30" cy="30" r="2" fill="#c7d2fe" />
            <circle cx="75" cy="35" r="1.5" fill="#c7d2fe" />
            <circle cx="25" cy="60" r="1.5" fill="#c7d2fe" />
          </svg>
        );
      case "waving":
        // Gentle leaf or plant
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Soft glow */}
            <circle cx="50" cy="50" r="40" fill="#d1fae5" opacity="0.3" />
            {/* Stem */}
            <path d="M 50 30 Q 48 50 50 70 Q 52 50 50 30" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Leaf - waving */}
            <ellipse cx="50" cy="45" rx="15" ry="20" fill="#10b981" transform="rotate(-15 50 45)" />
            <ellipse cx="50" cy="45" rx="12" ry="16" fill="#34d399" transform="rotate(-15 50 45)" />
            {/* Leaf veins */}
            <path d="M 50 35 L 50 55" stroke="#059669" strokeWidth="1.5" fill="none" />
            <path d="M 50 40 Q 45 45 50 50" stroke="#059669" strokeWidth="1" fill="none" />
            <path d="M 50 40 Q 55 45 50 50" stroke="#059669" strokeWidth="1" fill="none" />
            {/* Small decorative leaves */}
            <ellipse cx="45" cy="60" rx="6" ry="8" fill="#16a34a" transform="rotate(20 45 60)" />
            <ellipse cx="55" cy="65" rx="5" ry="7" fill="#16a34a" transform="rotate(-20 55 65)" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {getNatureSVG()}
    </div>
  );
}

// Floating animation wrapper
export function FloatingDino({ type = "happy", size = "md", className = "" }: NatureProps) {
  return (
    <div className={`animate-bounce ${className}`} style={{ animationDuration: "2s" }}>
      <Dino type={type} size={size} />
    </div>
  );
}

// Multiple nature elements for decoration
export function DinoGroup({ count = 3, className = "" }: { count?: number; className?: string }) {
  const types: NatureType[] = ["happy", "excited", "thinking", "waving"];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Dino key={i} type={types[i % types.length]} size="sm" />
      ))}
    </div>
  );
}
