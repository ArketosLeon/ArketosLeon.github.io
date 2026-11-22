// Astronomia simplificada (precisão suficiente para signos; trocar por API de efemérides depois)
const R = Math.PI / 180;
const n = (x: number) => ((x % 360) + 360) % 360;
export const dJ = (t: number) => t / 86400000 + 2440587.5 - 2451545;

export const sol = (d: number) => {
  const g = (357.529 + 0.98560028 * d) * R, q = 280.459 + 0.98564736 * d;
  return n(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
};
export const lua = (d: number) => {
  const L = 218.316 + 13.176396 * d, M = (134.963 + 13.064993 * d) * R, D = (297.85 + 12.190749 * d) * R;
  return n(L + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D));
};
export const asc = (d: number, lat: number, lon: number) => {
  const e = (23.439 - 0.0000004 * d) * R, th = n(280.46061837 + 360.98564736629 * d + lon) * R;
  return n(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(lat * R) * Math.sin(e))) / R);
};
export const sg = (l: number) => Math.floor(n(l) / 30);
export const fase = (d: number) => {
  const e = n(lua(d) - sol(d));
  return e < 22 || e >= 338 ? 'Lua Nova' : e < 158 ? 'Lua Crescente' : e < 202 ? 'Lua Cheia' : 'Lua Minguante';
};

export type Perfil = { nome: string; data: string; hora: string; cidade: number; whatsapp: string };
export type Mapa = { sun: number; moon: number; asc: number | null };

export function calcular(p: Perfil, cidades: [string, number, number, number][]): Mapa {
  const c = cidades[p.cidade];
  const [y, m, dd] = p.data.split('-').map(Number);
  const [h, mi] = (p.hora || '12:00').split(':').map(Number);
  const d = dJ(Date.UTC(y, m - 1, dd, h - c[3], mi));
  return { sun: sol(d), moon: lua(d), asc: p.hora ? asc(d, c[1], c[2]) : null };
}
