import React, { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

type Pt = { label: string; value: number };

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Full line chart with gridlines, gradient fill and a highlighted last point */
export function LineChart({
  data,
  height = 200,
  color = colors.primary,
  unit = '',
  showLabels = true,
  decimals = 0,
}: {
  data: Pt[];
  height?: number;
  color?: string;
  unit?: string;
  showLabels?: boolean;
  decimals?: number;
}) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const padL = 36;
  const padB = showLabels ? 24 : 6;
  const padT = 28;
  const padR = 12;

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
        <Text style={{ color: colors.muted }}>Log more data to see your trend</Text>
      </View>
    );
  }

  const vals = data.map((d) => d.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const pad = (max - min) * 0.15 || 1;
  min -= pad;
  max += pad;
  const iw = Math.max(1, w - padL - padR);
  const ih = height - padT - padB;
  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * iw,
    y: padT + (1 - (d.value - min) / (max - min)) * ih,
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${padT + ih} L ${pts[0].x} ${padT + ih} Z`;
  const ticks = [0, 0.5, 1].map((t) => min + (max - min) * (1 - t));
  const last = pts[pts.length - 1];
  const labelEvery = Math.ceil(data.length / 5);
  const lastLabel = `${data[data.length - 1].value.toFixed(decimals)}${unit}`;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((t, i) => {
            const y = padT + (i / 2) * ih;
            return (
              <G key={i}>
                <Line x1={padL} x2={w - padR} y1={y} y2={y} stroke={colors.border} strokeDasharray="3 5" />
                <SvgText x={padL - 6} y={y + 4} fill={colors.muted} fontSize={10} textAnchor="end">
                  {t.toFixed(decimals)}
                </SvgText>
              </G>
            );
          })}
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" />
          {data.length <= 16 &&
            pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.bg} stroke={color} strokeWidth={2} />)}
          <Circle cx={last.x} cy={last.y} r={6} fill={color} stroke={colors.bg} strokeWidth={3} />
          <Rect x={Math.min(last.x - 30, w - padR - 60)} y={last.y - 30} width={60} height={22} rx={8} fill={color} />
          <SvgText x={Math.min(last.x, w - padR - 30)} y={last.y - 15} fill="#fff" fontSize={11} fontWeight="700" textAnchor="middle">
            {lastLabel}
          </SvgText>
          {showLabels &&
            data.map((d, i) =>
              i % labelEvery === 0 || i === data.length - 1 ? (
                <SvgText key={i} x={pts[i].x} y={height - 6} fill={colors.muted} fontSize={10} textAnchor="middle">
                  {d.label}
                </SvgText>
              ) : null
            )}
        </Svg>
      )}
    </View>
  );
}

/** Compact trend line for stat cards */
export function Sparkline({ values, color = colors.primary, height = 44 }: { values: number[]; color?: string; height?: number }) {
  const [w, setW] = useState(0);
  if (values.length < 2) return <View style={{ height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({ x: 4 + (i / (values.length - 1)) * (w - 8), y: 4 + (1 - (v - min) / range) * (height - 8) }));
  const line = smoothPath(pts);
  const gid = `sp${color.replace('#', '')}`;
  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.3} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`} fill={`url(#${gid})`} />
          <Path d={line} stroke={color} strokeWidth={2} fill="none" />
          <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3.5} fill={color} />
        </Svg>
      )}
    </View>
  );
}

/** Simple vertical bars, e.g. weekly volume or calories per day */
export function Bars({
  data,
  height = 120,
  color = colors.primary,
  target,
  highlightLast = true,
}: {
  data: Pt[];
  height?: number;
  color?: string;
  target?: number;
  highlightLast?: boolean;
}) {
  const [w, setW] = useState(0);
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value)) * 1.1;
  const padB = 20;
  const ih = height - padB;
  const bw = data.length ? (w / data.length) * 0.55 : 0;
  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {target ? (
            <Line x1={0} x2={w} y1={ih - (target / max) * ih} y2={ih - (target / max) * ih} stroke={colors.faint} strokeDasharray="4 4" />
          ) : null}
          {data.map((d, i) => {
            const h = Math.max(3, (d.value / max) * ih);
            const x = (i + 0.5) * (w / data.length) - bw / 2;
            const active = highlightLast ? i === data.length - 1 : true;
            return (
              <G key={i}>
                <Rect x={x} y={ih - h} width={bw} height={h} rx={bw / 3} fill={active ? color : colors.card3} />
                <SvgText x={x + bw / 2} y={height - 4} fill={colors.muted} fontSize={10} textAnchor="middle">
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
