"use client";

import { motion } from "framer-motion";
import { Heart, ListChecks, Play, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Avatar } from "@/components/app/avatar";
import { ACCENT_GRADIENT, gradient } from "@/components/app/ui";

/** Animatsiyali halqa diagramma (0–100). */
export function ScoreRing({
  value,
  size = 180,
  stroke = 16,
  colors,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  colors: [string, string];
  children?: ReactNode;
}) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="1" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
        />
      </svg>
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}

/** Suzib yuruvchi pazl bo'lagi. */
function Piece({ color, size, style, delay }: { color: string; size: number; style: React.CSSProperties; delay: number }) {
  return (
    <span
      className="animate-float absolute"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: color,
        animationDelay: `${delay}ms`,
        ["--rot" as string]: "14deg",
        ["--float" as string]: "-10px",
        ...style,
      }}
    />
  );
}

function Pieces() {
  return (
    <>
      <Piece color="#3B82F6" size={26} style={{ top: 18, left: 26 }} delay={0} />
      <Piece color="#FACC15" size={20} style={{ top: 40, right: 22 }} delay={400} />
      <Piece color="#EF4444" size={16} style={{ bottom: 50, left: 12 }} delay={800} />
      <Piece color="#22C55E" size={22} style={{ bottom: 24, right: 36 }} delay={1200} />
    </>
  );
}

/** Onboarding va test sohalari uchun gradient doira ichidagi katta ikonka. */
export function Illustration({ icon: Icon, colors, size = 220 }: { icon: LucideIcon; colors: readonly string[]; size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 60, height: size + 40 }}>
      <span className="absolute rounded-full opacity-[0.12]" style={{ width: size + 40, height: size + 40, background: colors[0] }} />
      <span className="flex items-center justify-center rounded-full text-white" style={{ width: size, height: size, background: gradient(colors) }}>
        <Icon style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={2} />
      </span>
      <Piece color="#3B82F6" size={30} style={{ top: 10, left: 18 }} delay={0} />
      <Piece color="#FACC15" size={22} style={{ top: 30, right: 14 }} delay={300} />
      <Piece color="#EF4444" size={18} style={{ bottom: 24, left: 8 }} delay={600} />
      <Piece color="#22C55E" size={26} style={{ bottom: 6, right: 30 }} delay={900} />
    </div>
  );
}

const zoom = (delay = 0) => ({
  initial: { scale: 0.6, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] as const },
});

function Ring({ children, padding = 4 }: { children: ReactNode; padding?: number }) {
  return (
    <span className="inline-flex rounded-full bg-white shadow-[0_6px_12px_rgb(30_27_75/0.12)]" style={{ padding }}>
      {children}
    </span>
  );
}

function PulsingHeart({ size, style, delay = 0, color = "#F43F5E" }: { size: number; style: React.CSSProperties; delay?: number; color?: string }) {
  return (
    <span className="animate-pulse-scale absolute" style={{ animationDelay: `${delay}ms`, color, ...style }}>
      <Heart fill="currentColor" strokeWidth={0} style={{ width: size, height: size }} />
    </span>
  );
}

function IconWithAvatar({ icon: Icon, colors, avatar }: { icon: LucideIcon; colors: readonly string[]; avatar: string }) {
  return (
    <>
      <motion.span {...zoom()} className="flex h-[170px] w-[170px] items-center justify-center rounded-full text-white" style={{ background: gradient(colors) }}>
        <Icon className="h-[76px] w-[76px]" strokeWidth={2} />
      </motion.span>
      <motion.span {...zoom(250)} className="absolute bottom-[34px] right-6">
        <Ring>
          <Avatar id={avatar} size={96} />
        </Ring>
      </motion.span>
    </>
  );
}

const SIZE = 300;

/** Tanishtiruv slaydlari uchun illyustratsiyalar. */
export function IntroArt({ variant }: { variant: 0 | 1 | 2 | 3 }) {
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <span
        className="absolute rounded-full"
        style={{
          width: SIZE - 20,
          height: SIZE - 20,
          background: gradient(
            variant === 0 ? ["#EEF0FF", "#FCE7F3"] : variant === 1 ? ["#EEF0FF", "#E0E7FF"] : variant === 2 ? ["#FFF7E6", "#E3F8EA"] : ["#FFE8EE", "#EEF0FF"],
          ),
        }}
      />
      {variant === 0 && (
        <>
          <motion.span {...zoom(150)} className="absolute" style={{ left: 18, top: 92 }}>
            <Ring>
              <Avatar id="boy-1" size={92} />
            </Ring>
          </motion.span>
          <motion.span {...zoom(300)} className="absolute" style={{ right: 18, top: 92 }}>
            <Ring>
              <Avatar id="girl-4" size={92} />
            </Ring>
          </motion.span>
          <motion.span {...zoom()} className="absolute">
            <Ring padding={6}>
              <Avatar id="girl-1" size={132} />
            </Ring>
          </motion.span>
          <PulsingHeart size={30} style={{ top: 30, left: SIZE / 2 - 15 }} />
          <PulsingHeart size={18} style={{ bottom: 44, left: 64 }} delay={300} color="#FB7185" />
          <PulsingHeart size={22} style={{ bottom: 36, right: 58 }} delay={600} color="#A78BFA" />
        </>
      )}
      {variant === 1 && (
        <>
          <IconWithAvatar icon={ListChecks} colors={["#4338CA", "#6D28D9", "#7C3AED"]} avatar="boy-2" />
          <Pieces />
        </>
      )}
      {variant === 2 && (
        <>
          <IconWithAvatar icon={Play} colors={ACCENT_GRADIENT.lessons} avatar="girl-3" />
          <Pieces />
        </>
      )}
      {variant === 3 && (
        <>
          {(["boy-4", "girl-2", "boy-3", "girl-1"] as const).map((id, i) => {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const r = 98;
            return (
              <span key={id} className="absolute" style={{ transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)` }}>
                <motion.span {...zoom(120 * i)} className="inline-flex">
                  <Ring>
                    <Avatar id={id} size={78} />
                  </Ring>
                </motion.span>
              </span>
            );
          })}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute flex h-[78px] w-[78px] items-center justify-center rounded-full text-white"
            style={{ background: gradient(ACCENT_GRADIENT.centers) }}
          >
            <Heart fill="currentColor" strokeWidth={0} className="h-10 w-10" />
          </motion.span>
        </>
      )}
    </div>
  );
}
