import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { sym } from '@/components/ui';
import { FontFamily, Radius } from '@/constants/theme';
import { useTheme, useViz } from '@/hooks/use-theme';
import type { Trend } from '@/lib/progress';

/* Grafiklar: ingichka belgilar, 4px yumaloq uchlar, ko'zga tashlanmaydigan to'r chiziqlari.
   Ranglar theme.ts dagi Viz tokenlaridan (yorug' va qorong'i mavzu uchun alohida). */

/** Konteyner kengligi — SVG haqiqiy kenglikda chiziladi. */
function useWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  return [width, onLayout] as const;
}

/** Yuqori uchi 4px yumaloq, asosi to'g'ri ustun. */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

const AXIS_FONT = { fontFamily: FontFamily.semibold, fontSize: 11 } as const;

/** Bosilgan nuqta yoki ustun uchun kichik tooltip. */
function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const theme = useTheme();
  const left = Math.max(4, Math.min(x - 70, width - 144));
  return (
    <View
      pointerEvents="none"
      style={[styles.tooltip, { left, top: Math.max(0, y - 62), backgroundColor: theme.backgroundElement, borderColor: theme.border, shadowColor: theme.shadow }]}>
      {children}
    </View>
  );
}

/* ------------------------------ Belgi (trend) ------------------------------ */

function Badge({ icon, color, bg, label, value }: { icon: ReturnType<typeof sym>; color: string; bg: string; label: string; value?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <SymbolView name={icon} size={12} tintColor={color} weight="bold" />
      <ThemedText type="smallBold" style={{ color, fontSize: 12.5 }}>
        {[value, label].filter(Boolean).join(' ')}
      </ThemedText>
    </View>
  );
}

const DOWN = sym('arrow.down.right', 'south_east');
const UP = sym('arrow.up.right', 'north_east');
const FLAT = sym('minus', 'remove');

/** O'zgarish belgisi: rang + ikonka + yozuv (rang yolg'iz ma'no tashimaydi). Skriningda pasayish — yaxshi. */
export function TrendBadge({ trend, label, value }: { trend: Trend; label: string; value?: string }) {
  const theme = useTheme();
  const icon = trend === 'better' ? DOWN : trend === 'worse' ? UP : FLAT;
  const color = trend === 'better' ? theme.success : trend === 'worse' ? theme.danger : theme.textTertiary;
  const bg = trend === 'better' ? theme.successSoft : trend === 'worse' ? theme.dangerSoft : theme.backgroundMuted;
  return <Badge icon={icon} color={color} bg={bg} label={label} value={value} />;
}

/** Faollikda o'sish yaxshi — strelka yuqoriga, lekin yashil. */
export function ActivityBadge({ trend, label, value }: { trend: Trend; label: string; value?: string }) {
  const theme = useTheme();
  const icon = trend === 'better' ? UP : trend === 'worse' ? DOWN : FLAT;
  const color = trend === 'better' ? theme.success : trend === 'worse' ? theme.warning : theme.textTertiary;
  const bg = trend === 'better' ? theme.successSoft : trend === 'worse' ? theme.warningSoft : theme.backgroundMuted;
  return <Badge icon={icon} color={color} bg={bg} label={label} value={value} />;
}

/* ------------------------------ Skrining chizig'i ------------------------------ */

export type ScorePoint = { id: string; label: string; date: string; time: number; score: number };

/**
 * Skrining bali vaqt bo'yicha. Fonda xavf zonalari (past / o'rta / yuqori) — pastga tushish yaxshi.
 * Bitta seriya, shuning uchun legend yo'q; qiymat oxirgi nuqtada yoziladi.
 */
export function ScoreLineChart({ points, zones }: { points: ScorePoint[]; zones: { low: string; moderate: string; high: string } }) {
  const theme = useTheme();
  const viz = useViz();
  const [width, onLayout] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const H = 220;
  const pad = { top: 16, right: 60, bottom: 28, left: 30 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = H - pad.top - pad.bottom;
  const y = (v: number) => pad.top + h - (v / 100) * h;
  // Testlar har xil oraliqda topshiriladi — nuqtalar haqiqiy sana bo'yicha joylashadi
  const t0 = points[0]?.time ?? 0;
  const span = (points.at(-1)?.time ?? 0) - t0;
  const x = (i: number) => pad.left + (points.length === 1 || span === 0 ? w / 2 : ((points[i].time - t0) / span) * w);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score)}`).join('');
  const last = points.length - 1;
  // Ko'p test bo'lsa sanalar ustma-ust tushmasligi uchun faqat bir qismi yoziladi
  const step = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(w / 56))));

  return (
    <View onLayout={onLayout} style={{ width: '100%', height: H }} accessible accessibilityLabel={points.map((p) => `${p.date}: ${p.score}`).join(', ')}>
      {width > 0 && (
        <Svg width={width} height={H}>
          {(
            [
              [0, 30, viz.good, zones.low],
              [30, 60, viz.warn, zones.moderate],
              [60, 100, viz.bad, zones.high],
            ] as const
          ).map(([from, to, color, label]) => (
            <G key={label}>
              <Rect x={pad.left} y={y(to)} width={w} height={y(from) - y(to)} fill={color} opacity={0.08} />
              <SvgText x={pad.left + w + 6} y={(y(from) + y(to)) / 2 + 4} fill={theme.textTertiary} {...AXIS_FONT}>
                {label}
              </SvgText>
            </G>
          ))}
          {[0, 30, 60, 100].map((v) => (
            <G key={v}>
              <Line x1={pad.left} x2={pad.left + w} y1={y(v)} y2={y(v)} stroke={viz.grid} strokeWidth={1} />
              <SvgText x={pad.left - 6} y={y(v) + 4} textAnchor="end" fill={theme.textTertiary} {...AXIS_FONT}>
                {v}
              </SvgText>
            </G>
          ))}
          {points.map((p, i) =>
            i % step === 0 || i === last ? (
              <SvgText key={p.id} x={x(i)} y={H - 8} textAnchor="middle" fill={theme.textTertiary} {...AXIS_FONT}>
                {p.label}
              </SvgText>
            ) : null,
          )}
          {hover !== null && <Line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} stroke={viz.axis} strokeWidth={1} />}
          {points.length > 1 && <Path d={path} fill="none" stroke={viz.one} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {points.map((p, i) => (
            <G key={p.id} onPress={() => setHover(hover === i ? null : i)}>
              <Circle cx={x(i)} cy={y(p.score)} r={16} fill="transparent" />
              <Circle cx={x(i)} cy={y(p.score)} r={i === last || hover === i ? 6 : 4.5} fill={viz.one} stroke={theme.backgroundElement} strokeWidth={2} />
            </G>
          ))}
          {points.length > 0 && (
            // Oxirgi nuqta o'ng chekkada bo'lsa, yozuv zona nomlari ustiga tushmasligi uchun chapga suriladi
            <SvgText
              x={points.length > 1 ? x(last) + 4 : x(last)}
              y={y(points[last].score) - 12}
              textAnchor={points.length > 1 ? 'end' : 'middle'}
              fill={theme.text}
              fontFamily={FontFamily.bold}
              fontSize={13}>
              {String(points[last].score)}
            </SvgText>
          )}
        </Svg>
      )}
      {hover !== null && points[hover] && (
        <Tooltip x={x(hover)} y={y(points[hover].score)} width={width}>
          <ThemedText type="small" themeColor="textTertiary" style={styles.tipText}>
            {points[hover].date}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.tipText}>
            {points[hover].score} / 100
          </ThemedText>
        </Tooltip>
      )}
    </View>
  );
}

/* --------------------------------- Ustunlar --------------------------------- */

export type Segment = { key: string; value: number; color: string; label: string };
export type Column = { key: string; label: string; title: string; segments: Segment[] };

/** Ustunli grafik: bitta yoki bir nechta qatlamli (stacked). Qatlamlar orasida 2px bo'shliq; bosilganda tooltip. */
export function ColumnChart({ columns, height = 160 }: { columns: Column[]; height?: number }) {
  const theme = useTheme();
  const viz = useViz();
  const [width, onLayout] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 18, bottom: 24, left: 26, right: 4 };
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
    <View onLayout={onLayout} style={{ width: '100%', height }} accessible accessibilityLabel={columns.map((c, i) => `${c.title}: ${totals[i]}`).join(', ')}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {[0, niceMax / 2, niceMax].map((v) => (
            <G key={v}>
              <Line x1={pad.left} x2={pad.left + w} y1={pad.top + h - y(v)} y2={pad.top + h - y(v)} stroke={v === 0 ? viz.axis : viz.grid} />
              <SvgText x={pad.left - 6} y={pad.top + h - y(v) + 4} textAnchor="end" fill={theme.textTertiary} {...AXIS_FONT}>
                {v}
              </SvgText>
            </G>
          ))}
          {columns.map((c, i) => {
            const cx = pad.left + band * i + band / 2;
            let acc = 0;
            const visible = c.segments.filter((s) => s.value > 0);
            return (
              <G key={c.key} onPress={() => setHover(hover === i ? null : i)}>
                <Rect x={pad.left + band * i} y={pad.top} width={band} height={h} fill={hover === i ? viz.grid : 'transparent'} opacity={hover === i ? 0.5 : 1} />
                {visible.map((s, si) => {
                  const segH = y(s.value);
                  const top = pad.top + h - acc - segH;
                  acc += segH;
                  // Qatlamlar orasidagi 2px bo'shliq — yuqoridagi qatlamdan olinadi
                  const gap = si > 0 ? 2 : 0;
                  return si === visible.length - 1 ? (
                    <Path key={s.key} d={barPath(cx - barW / 2, top, barW, Math.max(0, segH - gap))} fill={s.color} />
                  ) : (
                    <Rect key={s.key} x={cx - barW / 2} y={top} width={barW} height={Math.max(0, segH - gap)} fill={s.color} />
                  );
                })}
                {i % labelEvery === 0 || i === columns.length - 1 ? (
                  <SvgText x={cx} y={height - 6} textAnchor="middle" fill={theme.textTertiary} {...AXIS_FONT}>
                    {c.label}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      )}
      {hover !== null && columns[hover] && (
        <Tooltip x={pad.left + band * hover + band / 2} y={pad.top + h - y(totals[hover])} width={width}>
          <ThemedText type="small" themeColor="textTertiary" style={styles.tipText}>
            {columns[hover].title}
          </ThemedText>
          {columns[hover].segments.length > 1 ? (
            columns[hover].segments.map((s) => (
              <View key={s.key} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <ThemedText type="small" style={[styles.tipText, { flex: 1 }]}>
                  {s.label}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.tipText, styles.num]}>
                  {s.value}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText type="smallBold" style={styles.tipText}>
              {totals[hover]}
            </ThemedText>
          )}
        </Tooltip>
      )}
    </View>
  );
}

/** Ikki va undan ortiq seriya uchun legend (rang yonida yozuv). */
export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.label} style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: i.color }]} />
          <ThemedText type="small" themeColor="textSecondary">
            {i.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

/* --------------------------------- O'lchagich --------------------------------- */

/** Foiz o'lchagichi: to'ldirilgan qism va o'sha tusning ochroq izi. */
export function Meter({ value, label }: { value: number; label: string }) {
  const viz = useViz();
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.between}>
        <ThemedText type="smallBold" style={{ flex: 1, fontSize: 14 }}>
          {label}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.num}>
          {value}%
        </ThemedText>
      </View>
      <View style={[styles.meterTrack, { backgroundColor: viz.one + '29' }]}>
        <View style={{ height: '100%', borderRadius: Radius.pill, width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: viz.one }} />
      </View>
    </View>
  );
}

/* ------------------------------ Sohalar (dumbbell) ------------------------------ */

/** Birinchi va oxirgi test natijasi bitta chiziqda: bo'sh doira — birinchi, to'liq — oxirgi. */
export function ChangeRow({ label, from, to, badge }: { label: string; from: number; to: number; badge: ReactNode }) {
  const theme = useTheme();
  const viz = useViz();
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.between, { flexWrap: 'wrap', gap: 8 }]}>
        <ThemedText type="smallBold" style={{ fontSize: 14 }}>
          {label}
        </ThemedText>
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textTertiary" style={styles.num}>
            {from}% → <ThemedText type="smallBold">{to}%</ThemedText>
          </ThemedText>
          {badge}
        </View>
      </View>
      <View style={{ height: 16, marginHorizontal: 7 }}>
        <View style={[styles.abs, { left: 0, right: 0, top: 7.5, height: 1, backgroundColor: viz.grid }]} />
        <View style={[styles.abs, { left: `${lo}%`, width: `${hi - lo}%`, top: 6.5, height: 3, borderRadius: 2, backgroundColor: viz.axis }]} />
        <View style={[styles.abs, styles.ring, { left: `${from}%`, borderColor: viz.axis, backgroundColor: theme.backgroundElement }]} />
        <View style={[styles.abs, styles.fill, { left: `${to}%`, borderColor: theme.backgroundElement, backgroundColor: viz.one }]} />
      </View>
    </View>
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
  const theme = useTheme();
  const viz = useViz();
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.week}>
        {weekdays.map((d) => (
          <ThemedText key={d} type="smallBold" themeColor="textTertiary" style={[styles.cellText, { flex: 1 }]}>
            {d}
          </ThemedText>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((c) => (
            <View
              key={c.day}
              accessible
              accessibilityLabel={`${c.day.split('-').reverse().join('.')} — ${c.done ? `${doneLabel} (${c.count})` : notDoneLabel}`}
              style={[
                styles.cell,
                c.future
                  ? { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border }
                  : { backgroundColor: c.done ? viz.one : theme.backgroundMuted },
              ]}>
              <ThemedText type="smallBold" style={[styles.cellText, styles.num, { color: c.done ? '#FFFFFF' : theme.textTertiary }]}>
                {Number(c.day.slice(8))}
              </ThemedText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------ Gorizontal ustunlar ------------------------------ */

/** Ko'nikmalar kabi ro'yxat: bitta seriya, qiymat ustun uchida. */
export function BarList({ items }: { items: { key: string; label: string; value: number }[] }) {
  const viz = useViz();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={{ gap: 10 }}>
      {items.map((i) => (
        <View key={i.key} style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ width: 110 }}>
            {i.label}
          </ThemedText>
          <View style={[styles.row, { flex: 1 }]}>
            <View style={{ height: 12, borderTopRightRadius: 4, borderBottomRightRadius: 4, width: `${(i.value / max) * 85}%`, minWidth: i.value ? 4 : 0, backgroundColor: viz.one }} />
            <ThemedText type="smallBold" style={styles.num}>
              {i.value}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Ulushlar chizig'i (masalan, mashg'ulot baholari): qatlamlar orasida 2px bo'shliq, legend bilan. */
export function ShareBar({ parts }: { parts: { key: string; value: number; color: string; label: string }[] }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return null;
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.share}>
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <View key={p.key} style={{ flex: p.value, backgroundColor: p.color }} />
          ))}
      </View>
      <Legend items={parts.map((p) => ({ color: p.color, label: `${p.label} · ${p.value}` }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    width: 140,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tipText: { fontSize: 12, lineHeight: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  num: { fontVariant: ['tabular-nums'] },
  meterTrack: { height: 10, width: '100%', overflow: 'hidden', borderRadius: Radius.pill },
  abs: { position: 'absolute' },
  ring: { top: 2, width: 12, height: 12, marginLeft: -6, borderRadius: 6, borderWidth: 2 },
  fill: { top: 1, width: 14, height: 14, marginLeft: -7, borderRadius: 7, borderWidth: 2 },
  week: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 11, textAlign: 'center' },
  share: { flexDirection: 'row', height: 14, width: '100%', gap: 2, overflow: 'hidden', borderRadius: 4 },
});
