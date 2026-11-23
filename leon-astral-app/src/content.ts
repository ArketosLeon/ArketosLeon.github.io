// Textos de reserva (a fonte principal é a tabela "biblioteca" no Supabase)
export const SIGNOS = ["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"];
export const GLIFOS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((c) => c + "\uFE0E");
export const ELEMENTOS = ["fogo","terra","ar","água"];
export const SOL: string[] = [
 "Você nasceu para começar coisas. Coragem e pressa andam juntas, e sua força é a iniciativa.",
 "Você constrói devagar e firme. Conforto, constância e prazeres simples te sustentam.",
 "Sua mente não para. Curiosidade e conversa são o seu combustível.",
 "Você sente antes de pensar. Cuidar e ser cuidado é o centro da sua vida.",
 "Você brilha quando é você mesmo. Generosidade e orgulho caminham juntos.",
 "Você melhora tudo o que toca. Detalhe, utilidade e cuidado com a rotina.",
 "Você busca equilíbrio e beleza. Relações justas são essenciais para você.",
 "Você vai fundo. Intensidade, lealdade e um grande poder de se transformar.",
 "Você precisa de horizonte. Liberdade, fé e vontade de aprender sempre.",
 "Você sobe com paciência. Responsabilidade e metas de longo prazo te movem.",
 "Você pensa diferente. Independência, amizades e ideias para o futuro.",
 "Você sente o mundo inteiro. Imaginação, empatia e intuição forte."
];
export const LUA: string[] = [
 "Emoções rápidas: você precisa agir para se sentir bem.",
 "Você se acalma com estabilidade, comida boa e rotina.",
 "Falar sobre o que sente é o que mais te alivia.",
 "Casa e família são seu porto seguro.",
 "Você precisa se sentir visto e valorizado.",
 "Organizar as coisas organiza o seu coração.",
 "Paz nas relações é paz por dentro.",
 "Sente tudo com intensidade e não suporta meias-verdades.",
 "Precisa de espaço, novidade e otimismo para se renovar.",
 "Segura a emoção e se sente seguro quando tem o controle.",
 "Precisa de liberdade até para sentir.",
 "Absorve o clima ao redor e precisa de momentos só seus."
];
export const ASC: string[] = ["direto e cheio de energia","calmo e confiável","comunicativo e leve","acolhedor e protetor","marcante e caloroso","discreto e atento","simpático e elegante","magnético e reservado","animado e franco","sério e competente","original e amigável","sensível e sonhador"];
export type Casa = { t: string; f: string; c: string; p: string };
export const CASAS: Casa[] = [
 {
  "t": "Você em foco",
  "f": "Bom dia para cuidar de você e tomar a iniciativa.",
  "c": "Reagir no impulso.",
  "p": "O que você quer começar hoje?"
 },
 {
  "t": "Dinheiro e valor",
  "f": "Revise gastos e valorize o que é seu.",
  "c": "Compras por emoção.",
  "p": "O que realmente vale a pena para você?"
 },
 {
  "t": "Conversas",
  "f": "Mensagens, estudos e pequenos trajetos fluem bem.",
  "c": "Fofoca e mal-entendidos.",
  "p": "Quem você está devendo uma resposta?"
 },
 {
  "t": "Casa e família",
  "f": "Fique perto de quem é casa para você.",
  "c": "Mágoas antigas voltando à tona.",
  "p": "Do que o seu lar precisa hoje?"
 },
 {
  "t": "Prazer e criatividade",
  "f": "Divirta-se, crie, brinque, namore.",
  "c": "Exagero e drama.",
  "p": "O que te dá alegria de verdade?"
 },
 {
  "t": "Rotina e saúde",
  "f": "Organize tarefas e cuide do corpo.",
  "c": "Se cobrar demais.",
  "p": "Que hábito pequeno ajudaria sua semana?"
 },
 {
  "t": "Relações",
  "f": "Parcerias e conversas a dois ganham força.",
  "c": "Querer agradar todo mundo.",
  "p": "O que você espera do outro, e já disse isso?"
 },
 {
  "t": "Profundidade",
  "f": "Bom para encerrar ciclos e resolver pendências.",
  "c": "Ciúme e controle.",
  "p": "O que você precisa deixar ir?"
 },
 {
  "t": "Horizontes",
  "f": "Estude, planeje uma viagem, pense grande.",
  "c": "Prometer mais do que dá.",
  "p": "Que ideia ou lugar está te chamando?"
 },
 {
  "t": "Carreira",
  "f": "Seu trabalho fica em evidência hoje.",
  "c": "Rigidez consigo mesmo.",
  "p": "Que passo te aproxima da sua meta?"
 },
 {
  "t": "Amigos e planos",
  "f": "Grupos, contatos e projetos futuros.",
  "c": "Dispersão.",
  "p": "Quem pode te ajudar nesse plano?"
 },
 {
  "t": "Recolhimento",
  "f": "Descanse, desacelere, durma mais cedo.",
  "c": "Isolamento e cansaço acumulado.",
  "p": "Do que você precisa se recuperar?"
 }
];
// CIDADES agora ficam em src/ceu.ts (com fuso IANA por cidade)
