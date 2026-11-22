import React from 'react';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { GLIFOS, SIGNOS } from './content';
import { sg } from './astro';
import { Theme } from './theme';

type Props = { size: number; t: Theme; sun?: number; moon?: number; asc?: number | null; today?: number };

export default function Wheel({ size, t, sun, moon, asc, today }: Props) {
  const c = size / 2, r = size / 2 - 10, R = Math.PI / 180;
  const P = (l: number, rr: number) => { const a = (180 + l) * R; return [c + rr * Math.cos(a), c - rr * Math.sin(a)]; };
  const marks: [string, number, string, boolean][] = [];
  if (sun != null) marks.push(['☉', sun, t.acc, false]);
  if (moon != null) marks.push(['☽', moon, t.sup, false]);
  if (asc != null) marks.push(['AC', asc, t.ink, false]);
  if (today != null) marks.push(['☽', today, t.soft, true]);
  return (
    <Svg width={size} height={size} accessibilityLabel={sun != null ? `Mapa: Sol em ${SIGNOS[sg(sun)]}` : 'Roda do zodíaco'}>
      <Circle cx={c} cy={c} r={r} fill={t.card} stroke={t.line} strokeWidth={1.5} />
      <Circle cx={c} cy={c} r={r * 0.72} fill="none" stroke={t.line} />
      <Circle cx={c} cy={c} r={r * 0.3} fill={t.bg} stroke={t.line} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = P(i * 30, r), [x2, y2] = P(i * 30, r * 0.72), [gx, gy] = P(i * 30 + 15, r * 0.86);
        const hi = sun != null && sg(sun) === i;
        return (
          <G key={i}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.line} />
            <SvgText x={gx} y={gy + 6} fontSize={r > 110 ? 17 : 13} fill={hi ? t.acc : t.soft} textAnchor="middle">{GLIFOS[i]}</SvgText>
          </G>
        );
      })}
      {marks.map(([g, l, col, dash], k) => {
        const [x1, y1] = P(l, r * 0.3), [x2, y2] = P(l, r * 0.72), [tx, ty] = P(l, r * 0.53 + (k % 2 ? 10 : -10));
        return (
          <G key={k}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={2} strokeDasharray={dash ? '4 4' : undefined} />
            <Circle cx={x2} cy={y2} r={4} fill={col} />
            <Circle cx={tx} cy={ty} r={13} fill={t.bg} stroke={col} />
            <SvgText x={tx} y={ty + 5} fontSize={g === 'AC' ? 10 : 14} fontWeight="700" fill={col} textAnchor="middle">{g}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
