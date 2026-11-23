// Exclui a conta do usuário logado e, em cascata, perfil, mapa, mensagens,
// horóscopos, denúncias e tokens de notificação (exigência da Google Play).
import { admin, CORS, json, usuario } from "../_shared/comum.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const u = await usuario(req);
  if (!u) return json({ erro: "não autenticado" }, 401);

  const body = await req.json().catch(() => ({}));
  if (body?.confirmar !== true) return json({ erro: "confirmação ausente" }, 400);

  const { error } = await admin().auth.admin.deleteUser(u.id);
  if (error) {
    console.error("excluir-conta", error.message);
    return json({ erro: "não foi possível excluir agora" }, 500);
  }
  return json({ ok: true });
});
