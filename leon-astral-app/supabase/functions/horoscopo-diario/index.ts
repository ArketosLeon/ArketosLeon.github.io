// Notificações do Leon Astral em teste: roda às 7h, 12h, 19h e 21h (Brasília) pelo pg_cron.
// Cada pessoa cai num horário (escolhido por ela ou sorteado de forma fixa) e recebe
// um tipo de notificação que varia por dia. Cada envio é gravado em push_envios para
// medir abertura por tipo e por horário (view push_desempenho e eventos no PostHog).
import { admin, CORS, json, SIGNOS } from "../_shared/comum.ts";
import { ceuAgora } from "./ceu.ts";

const HORAS = [7, 12, 19, 21];
const TIPOS = ["diario", "carta", "lua", "estela", "sintonia", "fase"] as const;
type Tipo = typeof TIPOS[number];

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

function mensagem(tipo: Tipo, nome: string, c: any, ceu: any, trocaHoje: boolean) {
  const lua = SIGNOS[ceu.luaSigno], prox = SIGNOS[ceu.proxSigno];
  switch (tipo) {
    case "carta": return { titulo: `${nome}, sua carta do dia foi sorteada ✧`, corpo: "Toque para virar e ver o conselho que ela traz para hoje.", tela: "hoje" };
    case "lua": return trocaHoje
      ? { titulo: `A Lua entra em ${prox} hoje ☽`, corpo: `Veja o que muda para você e qual área do seu mapa ela ilumina.`, tela: "hoje" }
      : { titulo: `Lua em ${lua} ☽`, corpo: `Ela passa pela sua casa de ${String(c.titulo).toLowerCase()}. Veja como aproveitar.`, tela: "hoje" };
    case "estela": return { titulo: "A Estela tem um recado para você ✉", corpo: `Com a Lua em ${lua}, ela separou uma pergunta para o seu dia. Vem conversar?`, tela: "oraculo" };
    case "sintonia": return { titulo: "Vocês combinam? ♡", corpo: "Compare o seu mapa com o de alguém especial e veja a sintonia de vocês.", tela: "sintonia" };
    case "fase": return { titulo: `${ceu.fase} em ${lua} 🌙`, corpo: ceu.fase === "Lua Cheia" ? "Bom momento para fechar ciclos. Veja o seu conselho." : "Bom momento para começar algo novo. Veja o seu conselho.", tela: "hoje" };
    default: return { titulo: `${nome}, hoje: ${String(c.titulo).toLowerCase()} ✧`, corpo: `Lua em ${lua} (${ceu.fase}). ${c.texto}`, tela: "hoje" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const db = admin();
  const token = req.headers.get("x-cron-token") ?? "";
  const { data: ok } = await db.rpc("verificar_cron", { token });
  if (!ok) return json({ erro: "não autorizado" }, 401);

  const agora = Date.now();
  const br = new Date(agora - 3 * 3600e3);
  const hoje = br.toISOString().slice(0, 10);
  const horaBR = br.getUTCHours();
  const body = await req.json().catch(() => ({}));
  const hora = HORAS.includes(body?.hora) ? body.hora : HORAS.reduce((a, b) => Math.abs(b - horaBR) < Math.abs(a - horaBR) ? b : a);
  const ceu = ceuAgora(agora);
  const fimDoDia = Date.parse(hoje + "T03:00:00Z") + 864e5;
  const trocaHoje = ceu.trocaEm < fimDoDia;
  const faseEspecial = ceu.fase === "Lua Cheia" || ceu.fase === "Lua Nova";

  const { data: casas } = await db.from("biblioteca").select("indice,titulo,texto,extra").eq("tipo", "casa_transito");
  const C = new Map((casas ?? []).map((c: any) => [c.indice, c]));
  const { data: pessoas, error } = await db.from("perfis")
    .select("id,nome,notificar_diario,push_hora,push_grupo,mapas(sol_signo)").eq("notificar_diario", true);
  if (error) return json({ erro: error.message }, 500);

  const linhas: any[] = [], envios: any[] = [], extras: Map<string, any> = new Map();
  for (const p of pessoas ?? []) {
    const mapa = Array.isArray(p.mapas) ? p.mapas[0] : p.mapas;
    if (!mapa || mapa.sol_signo == null) continue;
    const casa = (ceu.luaSigno - mapa.sol_signo + 12) % 12, c: any = C.get(casa);
    if (!c) continue;
    linhas.push({ user_id: p.id, data: hoje, lua_signo: ceu.luaSigno, casa, texto: `${c.titulo}. ${c.texto} Cuidado com: ${String(c.extra?.cuidado ?? "").toLowerCase()} Pergunta do dia: ${c.extra?.pergunta ?? ""}` });
    // horário: o que a pessoa escolheu, ou um sorteio fixo para o teste
    let grupo = p.push_hora ?? p.push_grupo;
    if (!grupo) { grupo = HORAS[hash(p.id) % 4]; await db.from("perfis").update({ push_grupo: grupo }).eq("id", p.id); }
    if (grupo !== hora) continue;
    // tipo do dia: gira pelos 6 tipos; "lua" e "fase" só quando há o evento
    let tipo: Tipo = TIPOS[(hash(p.id + hoje)) % TIPOS.length];
    if (tipo === "fase" && !faseEspecial) tipo = "diario";
    if (tipo === "lua" && !trocaHoje) tipo = "carta";
    const m = mensagem(tipo, p.nome || "Oi", c, ceu, trocaHoje);
    envios.push({ user_id: p.id, tipo, hora_grupo: hora, titulo: m.titulo });
    extras.set(p.id, m);
  }
  if (linhas.length) await db.from("horoscopos_diarios").upsert(linhas, { onConflict: "user_id,data" });
  if (!envios.length) return json({ data: hoje, hora, horoscopos: linhas.length, enviados: 0 });

  const { data: gravados, error: e3 } = await db.from("push_envios").insert(envios).select("id,user_id,tipo");
  if (e3) return json({ erro: e3.message }, 500);
  const porUser = new Map((gravados ?? []).map((g: any) => [g.user_id, g]));
  const { data: toks } = await db.from("push_tokens").select("token,user_id").in("user_id", [...porUser.keys()]).eq("ativo", true);
  const lista = (toks ?? []).map((t: any) => {
    const g: any = porUser.get(t.user_id), m = extras.get(t.user_id);
    return { to: t.token, sound: "default", title: m.titulo, body: m.corpo, channelId: "diario", data: { tela: m.tela, envio: g.id, tipo: g.tipo, hora } };
  });
  let enviados = 0, invalidos = 0;
  for (let i = 0; i < lista.length; i += 100) {
    const lote = lista.slice(i, i + 100);
    const r = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(lote) });
    const out = await r.json().catch(() => ({}));
    const res: any[] = out.data ?? [];
    for (let k = 0; k < res.length; k++) {
      if (res[k].status === "ok") enviados++;
      else if (res[k].details?.error === "DeviceNotRegistered") { invalidos++; await db.from("push_tokens").update({ ativo: false }).eq("token", lote[k].to); }
    }
  }
  return json({ data: hoje, hora, horoscopos: linhas.length, envios: envios.length, enviados, invalidos });
});
