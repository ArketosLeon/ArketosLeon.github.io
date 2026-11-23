// Horóscopo diário: roda todo dia às 7h (Brasília) pelo pg_cron.
// Calcula a Lua do dia, gera o texto de cada pessoa pela casa que a Lua
// atravessa no mapa dela, grava em horoscopos_diarios e manda o push (Expo).
import { admin, CORS, json, SIGNOS } from "../_shared/comum.ts";
import { ceuAgora } from "./ceu.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const db = admin();

  const token = req.headers.get("x-cron-token") ?? "";
  const { data: ok } = await db.rpc("verificar_cron", { token });
  if (!ok) return json({ erro: "não autorizado" }, 401);

  const agora = Date.now();
  const ceu = ceuAgora(agora);
  const hoje = new Date(agora - 3 * 3600e3).toISOString().slice(0, 10); // data em Brasília

  const { data: casas } = await db.from("biblioteca").select("indice,titulo,texto,extra").eq("tipo", "casa_transito");
  const C = new Map((casas ?? []).map((c: any) => [c.indice, c]));

  const { data: pessoas, error } = await db.from("perfis")
    .select("id,nome,notificar_diario,mapas(sol_signo)").eq("notificar_diario", true);
  if (error) return json({ erro: error.message }, 500);

  const linhas: any[] = [];
  const avisos = new Map<string, { titulo: string; corpo: string }>();
  for (const p of pessoas ?? []) {
    const mapa = Array.isArray(p.mapas) ? p.mapas[0] : p.mapas;
    if (!mapa || mapa.sol_signo == null) continue;
    const casa = (ceu.luaSigno - mapa.sol_signo + 12) % 12;
    const c: any = C.get(casa);
    if (!c) continue;
    const texto = `${c.titulo}. ${c.texto} Cuidado com: ${String(c.extra?.cuidado ?? "").toLowerCase()} Pergunta do dia: ${c.extra?.pergunta ?? ""}`;
    linhas.push({ user_id: p.id, data: hoje, lua_signo: ceu.luaSigno, casa, texto });
    avisos.set(p.id, { titulo: `${p.nome || "Bom dia"}, hoje: ${c.titulo.toLowerCase()} ✧`, corpo: `Lua em ${SIGNOS[ceu.luaSigno]} (${ceu.fase}). ${c.texto}` });
  }
  if (linhas.length) {
    const { error: e2 } = await db.from("horoscopos_diarios").upsert(linhas, { onConflict: "user_id,data" });
    if (e2) return json({ erro: e2.message }, 500);
  }

  // push
  const ids = [...avisos.keys()];
  let enviados = 0, invalidos = 0;
  if (ids.length) {
    const { data: toks } = await db.from("push_tokens").select("token,user_id").in("user_id", ids).eq("ativo", true);
    const lista = (toks ?? []).map((t: any) => ({ to: t.token, sound: "default", title: avisos.get(t.user_id)!.titulo, body: avisos.get(t.user_id)!.corpo, data: { tela: "hoje" }, channelId: "diario" }));
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
  }
  return json({ data: hoje, lua: SIGNOS[ceu.luaSigno], horoscopos: linhas.length, enviados, invalidos });
});
