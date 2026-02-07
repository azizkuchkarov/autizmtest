"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SparkleBackground() {
  const dots = Array.from({ length: 16 }).map((_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((i) => {
        const left = (i * 7) % 100;
        const top = (i * 11) % 100;
        const size = 6 + (i % 5) * 2;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-60"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              backgroundColor: i % 3 === 0 ? "#38BDF8" : i % 3 === 1 ? "#34D399" : "#FF6B6B",
              filter: "blur(0.2px)",
            }}
            animate={{ y: [0, -12, 0], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
