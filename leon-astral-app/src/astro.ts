// Ponte entre o app e o motor do céu (src/ceu.ts — Meeus + histórico de horário de verão do Brasil)
import { calcular as calc, ceuAgora as agora, CIDADES, fase, lua, sg, sol } from './ceu';

export { sg, CIDADES, lua, sol, fase };
export type Ceu = { lua: number; luaSigno: number; proxSigno: number; trocaEm: number; sol: number; solSigno: number; fase: string };
export const ceuAgora = (t?: number): Ceu => agora(t ?? Date.now());
export const cidades = CIDADES as unknown as Cidade[];
export type Cidade = [string, number, number, string, string];
export type Perfil = { nome: string; data: string; hora: string; cidade: number; whatsapp?: string };
export type Mapa = { sun: number; moon: number; asc: number | null; offset: number; luaDupla: [number, number] | null; solDuplo: [number, number] | null };

export function calcular(p: Perfil): Mapa {
  return calc(p) as Mapa;
}
