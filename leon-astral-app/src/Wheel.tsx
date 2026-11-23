// Roda zodiacal v12: anéis orbitais, aro em degradê dourado → roxo
import React from 'react';
import Svg, { Circle, Line, Text as SvgText, G, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { GLIFOS, SIGNOS } from './content';
import { sg } from './astro';

type Props = { size: number; sun?: number; moon?: number; asc?: number | null; today?: number };

export default function Wheel({ size, sun, moon, asc, today }: Props) {
  const c = size / 2, r = size / 2 - 12, R = Math.PI / 180;
  const P = (l: number, rr: number) => { const a = (180 + l) * R; return [c + rr * Math.cos(a), c - rr * Math.sin(a)]; };
  const marks: [string, number, string, boolean][] = [];
  if (sun != null) marks.push(['☉', sun, 'url(#gp)', false]);
  if (moon != null) marks.push(['☽', moon, '#A78BFA', false]);
  if (asc != null) marks.push(['AC', asc, '#E2B4BD', false]);
  if (today != null) marks.push(['☽', today, 'rgba(244,238,248,0.5)', true]);
  return (
    <Svg width={size} height={size} accessibilityLabel={sun != null ? `Mapa: Sol em ${SIGNOS[sg(sun)]}` : 'Roda do zodíaco'}>
      <Defs>
        <RadialGradient id="core" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F3C68F" stopOpacity={0.3} />
          <Stop offset="0.6" stopColor="#A78BFA" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#A78BFA" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FBE3BB" />
          <Stop offset="0.4" stopColor="#F3C68F" />
          <Stop offset="1" stopColor="#A78BFA" />
        </LinearGradient>
      </Defs>
      <Circle cx={c} cy={c} r={r * 0.45} fill="url(#core)" />
      {[1, 0.78, 0.56, 0.32].map((k, i) => (
        <Circle key={k} cx={c} cy={c} r={r * k} fill="none" stroke={i === 0 ? 'url(#gp)' : 'rgba(255,255,255,0.12)'} strokeWidth={i === 0 ? 1.4 : 1} strokeDasharray={i === 2 ? '2 5' : undefined} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = P(i * 30, r), [x2, y2] = P(i * 30, r * 0.78), [gx, gy] = P(i * 30 + 15, r * 0.89);
        const hi = sun != null && sg(sun) === i;
        return (
          <G key={i}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" />
            <SvgText x={gx} y={gy + 6} fontSize={r > 120 ? 17 : 14} fill={hi ? 'url(#gp)' : 'rgba(244,238,248,0.55)'} textAnchor="middle">{GLIFOS[i]}</SvgText>
          </G>
        );
      })}
      {marks.map(([g, l, col, dash], k) => {
        const [x1, y1] = P(l, r * 0.32), [x2, y2] = P(l, r * 0.78), [tx, ty] = P(l, r * 0.56 + (k % 2 ? 12 : -12));
        return (
          <G key={k}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={1.6} strokeDasharray={dash ? '4 4' : undefined} />
            <Circle cx={x2} cy={y2} r={4} fill={col} />
            <Circle cx={tx} cy={ty} r={14} fill="rgba(17,20,32,0.5)" stroke={col} />
            <SvgText x={tx} y={ty + 5} fontSize={g === 'AC' ? 11 : 15} fontWeight="700" fill={col} textAnchor="middle">{g}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
