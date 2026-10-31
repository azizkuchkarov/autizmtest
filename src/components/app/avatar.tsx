/* Mobil ilovadagi animatsion bola avatarlari (mobile/src/components/avatar.tsx) — web uchun SVG + CSS. */

type HairStyle = "short" | "curly" | "spiky" | "cap" | "pigtails" | "long" | "bob" | "ponytail";

export type AvatarSpec = {
  id: string;
  gender: "Qiz" | "O'g'il";
  hair: HairStyle;
  skin: string;
  hairColor: string;
  shirt: string;
  background: [string, string];
  accent?: string;
};

/** Ro'yxatdan o'tishda tanlanadigan avatarlar (id serverda saqlanadi). */
export const AVATARS: AvatarSpec[] = [
  { id: "boy-1", gender: "O'g'il", hair: "short", skin: "#F6D2B0", hairColor: "#4A3426", shirt: "#3B82F6", background: ["#DBEAFE", "#BFDBFE"] },
  { id: "boy-2", gender: "O'g'il", hair: "curly", skin: "#E3B48C", hairColor: "#1F1A17", shirt: "#22C55E", background: ["#DCFCE7", "#BBF7D0"] },
  { id: "boy-3", gender: "O'g'il", hair: "spiky", skin: "#C98E62", hairColor: "#6B4226", shirt: "#F97316", background: ["#FFEDD5", "#FED7AA"] },
  { id: "boy-4", gender: "O'g'il", hair: "cap", skin: "#F3C9A0", hairColor: "#3B2A20", shirt: "#6366F1", background: ["#E0E7FF", "#C7D2FE"], accent: "#EF4444" },
  { id: "girl-1", gender: "Qiz", hair: "pigtails", skin: "#F6D2B0", hairColor: "#6B4226", shirt: "#EC4899", background: ["#FCE7F3", "#FBCFE8"], accent: "#FACC15" },
  { id: "girl-2", gender: "Qiz", hair: "long", skin: "#E3B48C", hairColor: "#1F1A17", shirt: "#8B5CF6", background: ["#EDE9FE", "#DDD6FE"] },
  { id: "girl-3", gender: "Qiz", hair: "bob", skin: "#C98E62", hairColor: "#3B2A20", shirt: "#FACC15", background: ["#FEF9C3", "#FEF08A"], accent: "#EF4444" },
  { id: "girl-4", gender: "Qiz", hair: "ponytail", skin: "#F3C9A0", hairColor: "#9A4E1C", shirt: "#14B8A6", background: ["#CCFBF1", "#99F6E4"], accent: "#3B82F6" },
];

export function avatarById(id: string | null | undefined): AvatarSpec {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function avatarsFor(gender: string | null | undefined): AvatarSpec[] {
  return AVATARS.filter((a) => a.gender === gender);
}

function BackHair({ spec }: { spec: AvatarSpec }) {
  const c = spec.hairColor;
  switch (spec.hair) {
    case "pigtails":
      return (
        <g>
          <circle cx={23} cy={44} r={9} fill={c} />
          <circle cx={77} cy={44} r={9} fill={c} />
          <rect x={27} y={39} width={4} height={8} rx={2} fill={spec.accent} />
          <rect x={69} y={39} width={4} height={8} rx={2} fill={spec.accent} />
        </g>
      );
    case "long":
      return <path d="M25 46 C23 25 37 18 50 18 C63 18 77 25 75 46 L77 74 Q69 79 64 72 L63 54 L37 54 L36 72 Q31 79 23 74 Z" fill={c} />;
    case "bob":
      return <path d="M25 50 C23 27 37 19 50 19 C63 19 77 27 75 50 L75 62 Q70 66 65 61 L65 50 L35 50 L35 61 Q30 66 25 62 Z" fill={c} />;
    case "ponytail":
      return (
        <g>
          <ellipse cx={75} cy={36} rx={8} ry={15} fill={c} transform="rotate(28 75 36)" />
          <circle cx={70} cy={27} r={3.5} fill={spec.accent} />
        </g>
      );
    default:
      return null;
  }
}

function FrontHair({ spec }: { spec: AvatarSpec }) {
  const c = spec.hairColor;
  switch (spec.hair) {
    case "short":
      return <path d="M28 45 C27 28 38 21 50 21 C63 21 73 28 72 45 C68 36 60 32 50 32 C41 32 33 36 28 45 Z" fill={c} />;
    case "curly":
      return (
        <g fill={c}>
          <path d="M29 44 C28 30 38 24 50 24 C62 24 72 30 71 44 C66 37 58 34 50 34 C42 34 34 37 29 44 Z" />
          <circle cx={31} cy={37} r={6.5} />
          <circle cx={38} cy={28.5} r={7.5} />
          <circle cx={50} cy={25} r={8} />
          <circle cx={62} cy={28.5} r={7.5} />
          <circle cx={69} cy={37} r={6.5} />
        </g>
      );
    case "spiky":
      return <path d="M27 46 C26 30 37 20 50 20 C64 20 74 30 73 46 L68 38 L63 42 L58 34 L52 40 L46 33 L40 40 L34 35 Z" fill={c} />;
    case "cap":
      return (
        <g>
          <path d="M29 44 C30 40 34 38 38 38 L62 38 C66 38 70 40 71 44 Z" fill={c} />
          <path d="M27 40 C27 26 38 19 50 19 C62 19 73 26 73 40 Z" fill={spec.accent} />
          <path d="M50 37 L85 37 Q88 41 82 42.5 L50 42.5 Z" fill={spec.accent} opacity={0.85} />
          <circle cx={50} cy={20} r={2.5} fill="#FFFFFF" opacity={0.9} />
        </g>
      );
    case "pigtails":
    case "bob":
      return (
        <g>
          <path d="M28 46 C27 28 38 21 50 21 C62 21 73 28 72 46 C66 37 58 33 50 34 C42 33 34 37 28 46 Z" fill={c} />
          {spec.hair === "bob" && (
            <g>
              <path d="M58 24 L67 18 L66 30 Z" fill={spec.accent} />
              <path d="M58 24 L68 28 L60 33 Z" fill={spec.accent} />
              <circle cx={60} cy={26} r={2.6} fill={spec.accent} />
            </g>
          )}
        </g>
      );
    case "long":
      return <path d="M28 47 C27 28 38 20 50 20 C63 20 73 28 72 47 C67 35 55 30 44 33 C38 35 32 40 28 47 Z" fill={c} />;
    case "ponytail":
      return <path d="M28 45 C27 28 38 21 50 21 C62 21 73 28 72 45 C67 34 56 30 48 31 C40 32 33 37 28 45 Z" fill={c} />;
  }
}

/**
 * Animatsion bola avatari: yengil suzadi va vaqti-vaqti bilan pirpiraydi.
 * `animated={false}` ro'yxatlardagi kichik ko'rinishlar uchun.
 */
export function Avatar({ id, size = 96, animated = true }: { id: string | null | undefined; size?: number; animated?: boolean }) {
  const spec = avatarById(id);
  const offset = (spec.id.charCodeAt(spec.id.length - 1) % 4) * 0.22;
  const gid = `avbg-${spec.id}`;

  return (
    <span className="relative inline-block shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={spec.background[0]} />
            <stop offset="1" stopColor={spec.background[1]} />
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={50} fill={`url(#${gid})`} />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={animated ? "avatar-float absolute inset-0" : "absolute inset-0"}
        style={animated ? { animation: `float-y 3s ease-in-out ${offset}s infinite`, ["--float" as string]: "-3px" } : undefined}
      >
        <path d="M17 104 C17 84 31 75 50 75 C69 75 83 84 83 104 Z" fill={spec.shirt} />
        <path d="M42 75 Q50 82 58 75" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} fill="none" />
        <rect x={44} y={63} width={12} height={12} rx={5} fill={spec.skin} />
        <BackHair spec={spec} />
        <circle cx={28.5} cy={50} r={4.5} fill={spec.skin} />
        <circle cx={71.5} cy={50} r={4.5} fill={spec.skin} />
        <circle cx={50} cy={47} r={22} fill={spec.skin} />
        <FrontHair spec={spec} />
        <g
          className={animated ? "avatar-blink" : undefined}
          style={animated ? { transformOrigin: "50px 49px", animation: `blink 3s linear ${offset * 2}s infinite` } : undefined}
        >
          <ellipse cx={42} cy={49} rx={2.7} ry={3.3} fill="#2B2440" />
          <ellipse cx={58} cy={49} rx={2.7} ry={3.3} fill="#2B2440" />
        </g>
        <circle cx={42.9} cy={47.8} r={0.9} fill="#FFFFFF" />
        <circle cx={58.9} cy={47.8} r={0.9} fill="#FFFFFF" />
        <circle cx={36.5} cy={56} r={3.6} fill="#FF8FA3" opacity={0.45} />
        <circle cx={63.5} cy={56} r={3.6} fill="#FF8FA3" opacity={0.45} />
        <path d="M44.5 56.5 Q50 62.5 55.5 56.5" stroke="#2B2440" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}
