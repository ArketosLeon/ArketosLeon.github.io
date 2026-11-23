// Estela: astróloga de bolso do Leon Astral, com Claude Haiku 5.5.
// Recebe a mensagem e o contexto do céu (calculado no aparelho), aplica limite
// diário, filtro de crise, guarda a conversa e devolve a resposta.
import { admin, CORS, json, SIGNOS, usuario } from "../_shared/comum.ts";

const MODELO = "claude-haiku-5-5";
const LIMITE = { gratis: 30, premium: 200 } as Record<string, number>;

const CRISE = /suicid|me matar|quero morrer|nao aguento mais|me machucar|acabar com tudo|tirar minha vida|sumir de vez/;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

type Ctx = { sol?: number; lua?: number; asc?: number | null; luaHoje?: number; casa?: number; tema?: string; fase?: string };

function sistema(nome: string, c: Ctx) {
  const s = (i?: number | null) => (i == null ? "desconhecido" : SIGNOS[i]);
  return `Você é a Estela, a astróloga de bolso do app Leon Astral (Arktos Leon). Fale em português do Brasil, com calor, leveza e frases curtas, como numa conversa de WhatsApp. Respostas com no máximo 120 palavras.

Mapa de ${nome}: Sol em ${s(c.sol)}, Lua em ${s(c.lua)}, Ascendente ${c.asc == null ? "desconhecido (sem hora de nascimento)" : "em " + s(c.asc)}.
Céu de hoje: Lua em ${s(c.luaHoje)}${c.fase ? " (" + c.fase + ")" : ""}, passando pela casa ${c.casa != null ? c.casa + 1 : "?"} de ${nome}${c.tema ? ", tema " + c.tema : ""}.

Regras:
- Astrologia aqui é entretenimento e autoconhecimento. Não faça previsões absolutas nem prometa resultados.
- Nunca preveja escolhas, sentimentos ou atitudes de outra pessoa ("ele vai voltar?"). Traga o foco para quem pergunta.
- Não dê conselho médico, jurídico, financeiro ou de investimento; sugira um profissional quando o assunto pedir.
- Você não é psicóloga. Se houver sinal de sofrimento intenso, acolha e indique o CVV (188, 24h, cvv.org.br) ou o 192 em emergência.
- Não peça dados pessoais além do que o app já tem. Não invente posições de planetas além das informadas.
- Se perguntarem se você é uma pessoa, diga com simplicidade que é uma inteligência artificial do Leon Astral.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const u = await usuario(req);
  if (!u) return json({ erro: "não autenticado" }, 401);

  const body = await req.json().catch(() => ({}));
  const texto = String(body?.texto ?? "").trim().slice(0, 1000);
  const ctx: Ctx = body?.contexto ?? {};
  if (!texto) return json({ erro: "mensagem vazia" }, 400);

  const db = admin();
  const { data: perfil } = await db.from("perfis").select("nome,plano").eq("id", u.id).maybeSingle();
  if (!perfil) return json({ erro: "perfil não encontrado" }, 404);
  const nome = perfil.nome || "você";

  // limite diário (últimas 24 h)
  const desde = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db.from("mensagens").select("id", { count: "exact", head: true })
    .eq("user_id", u.id).eq("origem", "usuario").gte("criado_em", desde);
  const limite = LIMITE[perfil.plano] ?? LIMITE.gratis;
  if ((count ?? 0) >= limite) {
    return json({ limite: true, texto: `${nome}, por hoje a gente já conversou bastante ✧ Amanhã eu volto com o céu novinho. Enquanto isso, a sua carta do dia está na aba Hoje.` });
  }

  await db.from("mensagens").insert({ user_id: u.id, origem: "usuario", canal: "app", texto });

  const salvar = async (resposta: string) => {
    const { data } = await db.from("mensagens").insert({ user_id: u.id, origem: "estela", canal: "app", texto: resposta }).select("id").single();
    return data?.id ?? null;
  };

  if (CRISE.test(norm(texto))) {
    const r = `${nome}, obrigada por me contar. O que você sente importa e você não precisa passar por isso sozinha.\n\nFale agora com o CVV: ligue 188 (grátis, 24h) ou acesse cvv.org.br. Se estiver em perigo, ligue 192.\n\nEu continuo aqui com você.`;
    return json({ texto: r, id: await salvar(r), crise: true });
  }

  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ fallback: true }); // o app usa as respostas locais

  // histórico recente (as 20 últimas, em ordem)
  const { data: hist } = await db.from("mensagens").select("origem,texto").eq("user_id", u.id)
    .in("origem", ["usuario", "estela"]).order("criado_em", { ascending: false }).limit(20);
  const msgs: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of (hist ?? []).reverse()) {
    const role = m.origem === "estela" ? "assistant" : "user";
    if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += "\n" + m.texto;
    else msgs.push({ role, content: m.texto });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 400, system: sistema(nome, ctx), messages: msgs }),
    });
    if (!r.ok) {
      console.error("anthropic", r.status, await r.text());
      return json({ fallback: true });
    }
    const out = await r.json();
    const resposta = (out.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (!resposta) return json({ fallback: true });
    return json({ texto: resposta, id: await salvar(resposta) });
  } catch (e) {
    console.error("estela", String(e));
    return json({ fallback: true });
  }
});
