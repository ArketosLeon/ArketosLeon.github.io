// Recompensa por vídeo assistido: cada vídeo libera +1 pergunta para a Estela (até 10 por dia).
// O app chama depois do evento EARNED_REWARD do AdMob. Próximo passo: verificação pelo servidor
// do AdMob (SSV), para o crédito não depender só do aparelho.
import { admin, CORS, json, usuario } from "../_shared/comum.ts";

const MAX_DIA = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  const u = await usuario(req);
  if (!u) return json({ erro: "não autenticado" }, 401);

  const db = admin();
  const hojeBR = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const { data: uso } = await db.from("uso_diario").select("recompensas").eq("user_id", u.id).eq("data", hojeBR).maybeSingle();
  const atual = uso?.recompensas ?? 0;
  if (atual >= MAX_DIA) return json({ ok: false, motivo: "limite_diario", recompensas: atual, max: MAX_DIA });

  const { error } = await db.from("uso_diario").upsert({ user_id: u.id, data: hojeBR, recompensas: atual + 1 }, { onConflict: "user_id,data" });
  if (error) return json({ erro: error.message }, 500);
  return json({ ok: true, recompensas: atual + 1, max: MAX_DIA });
});
