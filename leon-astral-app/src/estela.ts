// Respostas locais da Estela: reserva quando a IA (edge function estela) não responde.
import { SIGNOS, SOL, LUA, ASC, CASAS } from './content';

export type Dia = { s: number; m: number; a: number | null; tm: number; ca: number; ceu?: any };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function respostaEstela(texto: string, nome: string, d: Dia): string {
  const t = norm(texto), H = CASAS[d.ca], s = SIGNOS[d.s], m = SIGNOS[d.m];
  if (/suicid|me matar|quero morrer|nao aguento mais|me machucar|acabar com tudo/.test(t))
    return `${nome}, obrigada por me contar. O que você sente é importante e você não precisa passar por isso sozinho.\n\nPor favor, fale agora com o CVV: ligue 188 (grátis, 24h) ou acesse cvv.org.br. Se estiver em perigo, ligue 192.\n\nEu continuo aqui com você.`;
  if (/^(oi|ola|oie|bom dia|boa tarde|boa noite)\b/.test(t)) return `Oi, ${nome}! Que bom te ver por aqui ✧ Quer o conselho de hoje, falar de amor ou de trabalho?`;
  if (/procurar|vai voltar|me liga|ele vai|ela vai/.test(t))
    return `Eu não consigo ver as escolhas de outra pessoa, e nenhum céu decide por ela.\n\nO que o seu mapa mostra é você: com Lua em ${m}, ${LUA[d.m].toLowerCase()}\n\nO que você quer sentir, seja qual for a resposta?`;
  if (/conselho|\bdia\b|hoje|agora/.test(t))
    return `Hoje a Lua passa pela sua casa ${d.ca + 1}: ${H.t.toLowerCase()}.\n✦ ${H.f}\n⚠ Cuidado com: ${H.c.toLowerCase()}\n\nPergunta para levar com você: ${H.p}`;
  if (/amor|namor|crush|relac|casad|esposa|marido/.test(t))
    return `No amor, sua Lua em ${m} diz muito: ${LUA[d.m].toLowerCase()}\n\n${[4, 6].includes(d.ca) ? 'E hoje o céu favorece o romance!' : 'Hoje o céu pede mais escuta do que cobrança.'}\n\nO que está acontecendo no seu coração?`;
  if (/trabalh|dinheiro|grana|emprego|carreira|chefe|negocio/.test(t))
    return `Com Sol em ${s}: ${SOL[d.s]}\n\n${[1, 5, 9].includes(d.ca) ? 'Hoje o céu está do seu lado no trabalho e no dinheiro.' : 'Hoje não é dia de decisões grandes com dinheiro. Planeje e decida amanhã.'}`;
  if (/ascendente|asc/.test(t))
    return d.a != null
      ? `Seu Ascendente em ${SIGNOS[d.a]} é a primeira impressão que você passa: alguém ${ASC[d.a]}.`
      : 'Para saber o seu Ascendente eu preciso da hora do seu nascimento. Ela costuma estar na certidão.';
  if (/reflet|ansios|triste|cansad|preocup|confus|medo/.test(t))
    return `Vamos com calma. Respira fundo comigo: 4 segundos puxando o ar, 4 soltando.\n\nSua Lua em ${m}: ${LUA[d.m].toLowerCase()}\n\nO que mais está pesando agora? Se for algo que dura muitos dias, conversar com um psicólogo pode ajudar muito.`;
  if (/obrigad|valeu|amei|gostei/.test(t)) return 'Fico feliz! Amanhã cedo eu te mando o céu do dia. ✧';
  if (/\b(oi|ola)\b/.test(t)) return `Oi, ${nome}! Quer saber do seu dia, do amor ou do trabalho?`;
  return `${nome}, eu só converso sobre o seu céu e o seu horóscopo ✧ Posso te contar sobre o seu Sol em ${s}, a Lua de hoje em ${SIGNOS[d.tm]} ou a sua carta do dia. Por onde começamos?`;
}
