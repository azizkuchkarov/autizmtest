"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Trend } from "@/lib/app/progress";

/* Grafiklar: ingichka belgilar, 4px yumaloq uchlar, ko'zga tashlanmaydigan to'r chiziqlari.
   Ranglar globals.css dagi --viz-* tokenlaridan (yorug' va qorong'i mavzu uchun alohida). */

/** Konteyner kengligini kuzatadi — SVG matnlari cho'zilmasligi uchun viewBox o'rniga haqiqiy kenglik. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Yuqori uchi 4px yumaloq, asosi to'g'ri ustun. */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/** Kursor ostidagi qiymat uchun kichik tooltip. */
function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const left = Math.max(4, Math.min(x - 70, width - 144));
  return (
    <div
      className="pointer-events-none absolute z-10 w-[140px] rounded-[10px] border border-line bg-element px-2.5 py-1.5 text-[12px] leading-snug text-ink shadow-card"
      style={{ left, top: Math.max(0, y - 58) }}
    >
      {children}
    </div>
  );
}

/* ------------------------------ Belgi (trend) ------------------------------ */

/** O'zgarish belgisi: rang + ikonka + yozuv (rang yolg'iz ma'no tashimaydi). */
export function TrendBadge({ trend, label, value }: { trend: Trend; label: string; value?: string }) {
  const Icon = trend === "better" ? ArrowDownRight : trend === "worse" ? ArrowUpRight : Minus;
  const color = trend === "better" ? "var(--success)" : trend === "worse" ? "var(--danger)" : "var(--text-tertiary)";
  const bg = trend === "better" ? "var(--success-soft)" : trend === "worse" ? "var(--danger-soft)" : "var(--muted)";
  return (
    <span className="t-small-bold inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[12.5px]" style={{ color, background: bg }}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
      {value ? <span>{value}</span> : null}
      {label}
    </span>
  );
}

/** Faollikda o'sish yaxshi — strelka yuqoriga, lekin yashil. */
export function ActivityBadge({ trend, label, value }: { trend: Trend; label: string; value?: string }) {
  const Icon = trend === "better" ? ArrowUpRight : trend === "worse" ? ArrowDownRight : Minus;
  const color = trend === "better" ? "var(--success)" : trend === "worse" ? "var(--warning)" : "var(--text-tertiary)";
  const bg = trend === "better" ? "var(--success-soft)" : trend === "worse" ? "var(--warning-soft)" : "var(--muted)";
  return (
    <span className="t-small-bold inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[12.5px]" style={{ color, background: bg }}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
      {value ? <span>{value}</span> : null}
      {label}
    </span>
  );
}

/* ------------------------------ Skrining chizig'i ------------------------------ */

export type ScorePoint = { id: string; label: string; date: string; time: number; score: number };

/**
 * Skrining bali vaqt bo'yicha. Fonda xavf zonalari (past / o'rta / yuqori) — pastga tushish yaxshi.
 * Bitta seriya, shuning uchun legend yo'q; qiymat oxirgi nuqtada yoziladi.
 */
export function ScoreLineChart({ points, zones }: { points: ScorePoint[]; zones: { low: string; moderate: string; high: string } }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 220;
  const pad = { top: 16, right: 64, bottom: 28, left: 34 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = H - pad.top - pad.bottom;
  const y = (v: number) => pad.top + h - (v / 100) * h;
  // Testlar har xil oraliqda topshiriladi — nuqtalar haqiqiy sana bo'yicha joylashadi
  const t0 = points[0]?.time ?? 0;
  const span = (points.at(-1)?.time ?? 0) - t0;
  const x = (i: number) => pad.left + (points.length === 1 || span === 0 ? w / 2 : ((points[i].time - t0) / span) * w);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.score)}`).join("");
  const last = points.length - 1;
  // Ko'p test bo'lsa sanalar ustma-ust tushmasligi uchun faqat bir qismi yoziladi
  const step = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(w / 72))));

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={points.map((p) => `${p.date}: ${p.score}`).join(", ")}>
          {/* Xavf zonalari */}
          {(
            [
              [0, 30, "var(--viz-good)", zones.low],
              [30, 60, "var(--viz-warn)", zones.moderate],
              [60, 100, "var(--viz-bad)", zones.high],
            ] as const
          ).map(([from, to, color, label]) => (
            <g key={label}>
              <rect x={pad.left} y={y(to)} width={w} height={y(from) - y(to)} fill={color} opacity={0.08} />
              <text x={pad.left + w + 8} y={(y(from) + y(to)) / 2 + 4} className="fill-ink-3 text-[11px] font-semibold">
                {label}
              </text>
            </g>
          ))}
          {[0, 30, 60, 100].map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={pad.left + w} y1={y(v)} y2={y(v)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                {v}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % step === 0 || i === last ? (
              <text key={p.id} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-3 text-[11px]">
                {p.label}
              </text>
            ) : null,
          )}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} stroke="var(--viz-axis)" strokeWidth={1} />}
          {points.length > 1 && <path d={path} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {points.map((p, i) => (
            <g key={p.id} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <circle cx={x(i)} cy={y(p.score)} r={14} fill="transparent" />
              <circle
                cx={x(i)}
                cy={y(p.score)}
                r={i === last || hover === i ? 6 : 4.5}
                fill="var(--viz-1)"
                stroke="var(--element)"
                strokeWidth={2}
              />
            </g>
          ))}
          {points.length > 0 && (
            <text x={x(last)} y={y(points[last].score) - 12} textAnchor="middle" className="fill-ink text-[13px] font-bold">
              {points[last].score}
            </text>
          )}
        </svg>
      )}
      {hover !== null && points[hover] && (
        <Tooltip x={x(hover)} y={y(points[hover].score)} width={width}>
          <div className="text-ink-3">{points[hover].date}</div>
          <div className="font-bold">{points[hover].score} / 100</div>
        </Tooltip>
      )}
    </div>
  );
}

/* --------------------------------- Ustunlar --------------------------------- */

export type Segment = { key: string; value: number; color: string; label: string };
export type Column = { key: string; label: string; title: string; segments: Segment[] };

/**
 * Ustunli grafik: bitta yoki bir nechta qatlamli (stacked). Qatlamlar orasida 2px bo'shliq.
 * Har bir ustun ustiga kelganda tooltip.
 */
export function ColumnChart({ columns, height = 160 }: { columns: Column[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 18, bottom: 24, left: 28, right: 4 };
  const h = height - pad.top - pad.bottom;
  const w = Math.max(0, width - pad.left - pad.right);
  const totals = columns.map((c) => c.segments.reduce((n, s) => n + s.value, 0));
  const rawMax = Math.max(1, ...totals);
  const niceMax = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const band = columns.length ? w / columns.length : 0;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => (v / niceMax) * h;
  const labelEvery = Math.max(1, Math.ceil(columns.length / Math.max(1, Math.floor(w / 36))));

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={columns.map((c, i) => `${c.title}: ${totals[i]}`).join(", ")}>
          {[0, niceMax / 2, niceMax].map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={pad.left + w} y1={pad.top + h - y(v)} y2={pad.top + h - y(v)} stroke={v === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} />
              <text x={pad.left - 6} y={pad.top + h - y(v) + 4} textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                {v}
              </text>
            </g>
          ))}
          {columns.map((c, i) => {
            const cx = pad.left + band * i + band / 2;
            let acc = 0;
            const visible = c.segments.filter((s) => s.value > 0);
            return (
              <g key={c.key} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <rect x={pad.left + band * i} y={pad.top} width={band} height={h} fill={hover === i ? "var(--viz-grid)" : "transparent"} opacity={0.5} />
                {visible.map((s, si) => {
                  const segH = y(s.value);
                  const top = pad.top + h - acc - segH;
                  acc += segH;
                  const isTop = si === visible.length - 1;
                  // Qatlamlar orasidagi 2px bo'shliq — yuqoridagi qatlamdan olinadi
                  const gap = si > 0 ? 2 : 0;
                  return isTop ? (
                    <path key={s.key} d={barPath(cx - barW / 2, top, barW, Math.max(0, segH - gap))} fill={s.color} />
                  ) : (
                    <rect key={s.key} x={cx - barW / 2} y={top} width={barW} height={Math.max(0, segH - gap)} fill={s.color} />
                  );
                })}
                {i % labelEvery === 0 || i === columns.length - 1 ? (
                  <text x={cx} y={height - 6} textAnchor="middle" className="fill-ink-3 text-[11px]">
                    {c.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && columns[hover] && (
        <Tooltip x={pad.left + band * hover + band / 2} y={pad.top + h - y(totals[hover])} width={width}>
          <div className="text-ink-3">{columns[hover].title}</div>
          {columns[hover].segments.length > 1 ? (
            columns[hover].segments.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="flex-1">{s.label}</span>
                <span className="font-bold tabular-nums">{s.value}</span>
              </div>
            ))
          ) : (
            <div className="font-bold">{totals[hover]}</div>
          )}
        </Tooltip>
      )}
    </div>
  );
}

/** Ikki va undan ortiq seriya uchun legend (rang yonida yozuv). */
export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="t-small flex items-center gap-1.5 text-ink-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* --------------------------------- O'lchagich --------------------------------- */

/** Foiz o'lchagichi: to'ldirilgan qism va o'sha tusning ochroq izi. */
export function Meter({ value, label, caption }: { value: number; label: string; caption?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-small-bold text-[14px]">{label}</span>
        <span className="t-small-bold tabular-nums text-ink">{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--viz-1) 16%, transparent)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "var(--viz-1)" }} />
      </div>
      {caption ? <span className="t-small text-ink-3">{caption}</span> : null}
    </div>
  );
}

/* ------------------------------ Sohalar (dumbbell) ------------------------------ */

/** Birinchi va oxirgi test natijasi bitta chiziqda: bo'sh doira — birinchi, to'liq — oxirgi. */
export function ChangeRow({ label, from, to, badge }: { label: string; from: number; to: number; badge: ReactNode }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="t-small-bold text-[14px]">{label}</span>
        <span className="flex items-center gap-2">
          <span className="t-small tabular-nums text-ink-3">
            {from}% → <span className="font-bold text-ink">{to}%</span>
          </span>
          {badge}
        </span>
      </div>
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--viz-grid)]" />
        <div className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--viz-axis)]" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-element"
          style={{ left: `${from}%`, borderColor: "var(--viz-axis)" }}
        />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--element)]"
          style={{ left: `${to}%`, background: "var(--viz-1)" }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Kalendar --------------------------------- */

/** 5 haftalik kalendar: mashg'ulot bo'lgan kunlar to'ldirilgan. */
export function CalendarHeat({
  weeks,
  weekdays,
  doneLabel,
  notDoneLabel,
}: {
  weeks: { day: string; done: boolean; future: boolean; count: number }[][];
  weekdays: string[];
  doneLabel: string;
  notDoneLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((d) => (
          <span key={d} className="text-center text-[11px] font-semibold text-ink-3">
            {d}
          </span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1.5">
          {week.map((c) => (
            <span
              key={c.day}
              title={`${c.day.split("-").reverse().join(".")} — ${c.done ? `${doneLabel} (${c.count})` : notDoneLabel}`}
              className="flex aspect-square items-center justify-center rounded-[8px] text-[11px] font-semibold tabular-nums"
              style={{
                background: c.future ? "transparent" : c.done ? "var(--viz-1)" : "var(--muted)",
                color: c.done ? "#fff" : "var(--text-tertiary)",
                border: c.future ? "1px dashed var(--border)" : undefined,
              }}
            >
              {Number(c.day.slice(8))}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Gorizontal ustunlar ------------------------------ */

/** Ko'nikmalar kabi ro'yxat: bitta seriya, qiymat ustun uchida. */
export function BarList({ items }: { items: { key: string; label: ReactNode; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((i) => (
        <div key={i.key} className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-3">
          <span className="t-small truncate text-ink-2">{i.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-3 rounded-r-[4px]" style={{ width: `${(i.value / max) * 85}%`, minWidth: i.value ? 4 : 0, background: "var(--viz-1)" }} />
            <span className="t-small-bold tabular-nums text-ink">{i.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Ulushlar chizig'i (masalan, mashg'ulot baholari): qatlamlar orasida 2px bo'shliq, legend bilan. */
export function ShareBar({ parts }: { parts: { key: string; value: number; color: string; label: string }[] }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-[4px]">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <span key={p.key} title={`${p.label}: ${p.value}`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
          ))}
      </div>
      <Legend items={parts.map((p) => ({ color: p.color, label: `${p.label} · ${p.value}` }))} />
    </div>
  );
}
