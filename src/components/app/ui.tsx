"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, LoaderCircle, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

/* -------------------------------- Aksentlar -------------------------------- */

/** Bo'lim aksentlari — mobil ilovadagi Accents bilan bir xil. */
export type AccentName = "test" | "lessons" | "exercises" | "centers";

export const ACCENT_GRADIENT: Record<AccentName, [string, string]> = {
  test: ["#4F46E5", "#3B82F6"],
  lessons: ["#F59E0B", "#F97316"],
  exercises: ["#10B981", "#22C55E"],
  centers: ["#F43F5E", "#EC4899"],
};

export function accent(name: AccentName) {
  return { fg: `var(--${name})`, soft: `var(--${name}-soft)`, gradient: ACCENT_GRADIENT[name] };
}

export function gradient(colors: readonly string[]) {
  return `linear-gradient(135deg, ${colors.join(", ")})`;
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* --------------------------------- Harakat --------------------------------- */

/** Mobil ilovadagi FadeInDown animatsiyasi. */
export function FadeIn({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------- Layout --------------------------------- */

/** Sahifa konteyneri: mobil Screen kabi markazda, 720px gacha. */
export function Screen({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cx("mx-auto flex w-full flex-col gap-4 px-4 pb-10 pt-4 sm:px-6", wide ? "max-w-5xl" : "max-w-[760px]", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start gap-4 pb-2 pt-4">
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="t-title">{title}</h1>
        {subtitle ? <p className="t-body text-ink-2">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function SectionHeader({ title, action, href, onAction }: { title: string; action?: string; href?: string; onAction?: () => void }) {
  return (
    <div className="mt-4 flex items-center">
      <h2 className="t-heading flex-1">{title}</h2>
      {action && href ? (
        <Link href={href} className="t-small-bold text-tint hover:underline">
          {action}
        </Link>
      ) : action && onAction ? (
        <button onClick={onAction} className="t-small-bold text-tint hover:underline">
          {action}
        </button>
      ) : null}
    </div>
  );
}

/* --------------------------------- Yuzalar --------------------------------- */

const pressable = "transition-transform duration-150 active:scale-[0.97] cursor-pointer";

export function Card({
  children,
  className,
  style,
  href,
  onClick,
  flat,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  href?: string;
  onClick?: () => void;
  flat?: boolean;
}) {
  const cls = cx("flex flex-col gap-2 rounded-[24px] border border-line bg-element p-[18px]", !flat && "shadow-card", (href || onClick) && pressable, className);
  if (href)
    return (
      <Link href={href} className={cx(cls, "hover:border-tint/40")} style={style}>
        {children}
      </Link>
    );
  if (onClick)
    return (
      <button onClick={onClick} className={cx(cls, "text-left hover:border-tint/40")} style={style}>
        {children}
      </button>
    );
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export function HeroCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("bg-hero relative overflow-hidden rounded-[24px] p-6 text-white", className)}>{children}</div>;
}

/* --------------------------------- Tugmalar --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";

export function Button({
  title,
  onClick,
  href,
  variant = "primary",
  disabled,
  loading,
  icon: Icon,
  size = "lg",
  type = "button",
  className,
}: {
  title: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  size?: "md" | "lg";
  type?: "button" | "submit";
  className?: string;
}) {
  const inactive = disabled || loading;
  const cls = cx(
    "inline-flex w-full items-center justify-center gap-2 rounded-[18px] px-6 font-bold select-none",
    size === "lg" ? "h-14 text-[16.5px]" : "h-11 text-[15px]",
    variant === "primary" && "bg-primary-gradient text-white shadow-[0_8px_20px_rgb(79_70_229/0.25)]",
    variant === "secondary" && "border border-line bg-element text-ink hover:bg-muted",
    variant === "ghost" && "bg-tint-soft text-tint",
    variant === "light" && "bg-white text-[#312E81]",
    inactive ? "pointer-events-none opacity-45" : pressable,
    className,
  );
  const inner = loading ? (
    <LoaderCircle className="h-5 w-5 animate-spin" />
  ) : (
    <>
      {Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} /> : null}
      {title}
    </>
  );
  if (href && !inactive)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={inactive} className={cls}>
      {inner}
    </button>
  );
}

export function IconButton({ icon: Icon, onClick, label, href }: { icon: LucideIcon; onClick?: () => void; label: string; href?: string }) {
  const cls = cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-element text-ink hover:bg-muted", pressable);
  if (href)
    return (
      <Link href={href} aria-label={label} className={cls}>
        <Icon className="h-5 w-5" />
      </Link>
    );
  return (
    <button onClick={onClick} aria-label={label} className={cls}>
      <Icon className="h-5 w-5" />
    </button>
  );
}

/* ------------------------------ Kichik qismlar ------------------------------ */

/** Yumshoq fonli kvadrat ichidagi ikonka. */
export function IconBadge({ icon: Icon, color, background, size = 46 }: { icon: LucideIcon; color: string; background: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size, borderRadius: size * 0.32, background, color }}>
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={2.2} />
    </span>
  );
}

export function Pill({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <span className="t-small-bold inline-flex w-fit self-start rounded-full px-2.5 py-1 text-[12.5px]" style={{ color, background }}>
      {label}
    </span>
  );
}

/** Tanlov tugmasi (filtrlar, viloyatlar). */
export function OptionChip({ label, selected, onClick, className }: { label: string; selected: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        "t-small-bold shrink-0 rounded-[18px] border-[1.5px] px-4 py-2.5 text-[14.5px]",
        selected ? "border-tint bg-tint-soft text-tint" : "border-line bg-element text-ink hover:bg-muted",
        pressable,
        className,
      )}
    >
      {label}
    </button>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden bg-muted" style={{ height, borderRadius: height / 2 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ height: "100%", borderRadius: height / 2, background: color ?? "var(--tint)" }}
      />
    </div>
  );
}

export function Skeleton({ height, width = "100%", radius = 18, className }: { height: number; width?: number | string; radius?: number; className?: string }) {
  return <div className={cx("animate-skeleton bg-muted", className)} style={{ height, width, borderRadius: radius }} />;
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cx("h-6 w-6 animate-spin text-tint", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionTitle,
  onAction,
  color,
  background,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  actionTitle?: string;
  onAction?: () => void;
  color?: string;
  background?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
      <span
        className="mb-2 flex h-[76px] w-[76px] items-center justify-center rounded-full"
        style={{ background: background ?? "var(--tint-soft)", color: color ?? "var(--tint)" }}
      >
        <Icon className="h-[34px] w-[34px]" />
      </span>
      <h3 className="t-heading">{title}</h3>
      {body ? <p className="t-body max-w-[300px] text-ink-2">{body}</p> : null}
      {actionTitle && onAction ? (
        <div className="mt-2 min-w-[180px]">
          <Button title={actionTitle} variant="ghost" size="md" onClick={onAction} />
        </div>
      ) : null}
    </div>
  );
}

/** Brend yozuvi: "autizm" to'q + "test" indigo. */
export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="font-extrabold" style={{ fontSize: size, lineHeight: 1.25, letterSpacing: -size * 0.03 }}>
      autizm<span className="text-tint">test</span>
    </span>
  );
}

/** Brend belgisi: pazl-yurak logotipi. */
export function BrandMark({ size = 40 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- kichik SVG
  return <img src="/brand/logo-mark.svg" alt="" width={size} height={size} style={{ width: size, height: size }} />;
}

/** Sozlamalar uslubidagi ro'yxat qatori. */
export function ListRow({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  value,
  href,
  onClick,
  last,
  right,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle?: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  last?: boolean;
  right?: ReactNode;
}) {
  const interactive = !!(href || onClick);
  const content = (
    <div className="flex items-center gap-4 pl-4">
      <IconBadge icon={icon} color={iconColor} background={iconBackground} size={36} />
      <div className={cx("flex flex-1 items-center gap-2 py-3.5 pr-4", !last && "border-b border-line")}>
        <div className="flex-1 text-left">
          <div className="t-default">{title}</div>
          {subtitle ? <div className="t-small text-ink-2">{subtitle}</div> : null}
        </div>
        {value ? <span className="t-small text-ink-2">{value}</span> : null}
        {right}
        {interactive ? <ChevronRight className="h-4 w-4 text-ink-3" /> : null}
      </div>
    </div>
  );
  if (href)
    return (
      <Link href={href} className="block hover:bg-muted">
        {content}
      </Link>
    );
  if (onClick)
    return (
      <button onClick={onClick} className="block w-full hover:bg-muted">
        {content}
      </button>
    );
  return content;
}

/** iOS uslubidagi segment tanlagich. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-[18px] bg-muted p-1" role="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            className={cx(
              "t-small-bold h-[42px] flex-1 rounded-[12px] text-[14.5px]",
              selected ? "bg-element text-ink shadow-card" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Dialog --------------------------------- */

/** Tasdiqlash oynasi — mobil ilovadagi Alert.alert o'rnida. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onCancel} role="presentation">
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[400px] flex-col gap-3 rounded-[24px] border border-line bg-element p-6 shadow-card"
      >
        <h2 id="confirm-title" className="t-heading">
          {title}
        </h2>
        <p className="t-body text-ink-2">{body}</p>
        <div className="mt-2 flex gap-2">
          <Button title={cancelLabel} variant="secondary" size="md" onClick={onCancel} />
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cx(
              "inline-flex h-11 w-full items-center justify-center rounded-[18px] px-4 text-[15px] font-bold text-white disabled:opacity-50",
              destructive ? "bg-danger" : "bg-tint",
              pressable,
            )}
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
