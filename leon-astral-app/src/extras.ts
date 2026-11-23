// @ts-nocheck
// Gerado de tools/extras.js — não editar à mão
/* Leon Astral — oráculo do dia e sintonia (compatibilidade pelo mapa) */
var ORACULO=[
["O Louco","Começos leves","Hoje pede coragem para dar o primeiro passo sem ter o caminho todo desenhado.","Experimente algo pequeno e novo, sem cobrar perfeição."],
["O Mago","Você tem as ferramentas","O que você precisa já está nas suas mãos: talento, palavra e vontade.","Escolha uma coisa e coloque energia nela até o fim do dia."],
["A Sacerdotisa","Escute por dentro","A resposta não vem do barulho de fora. Ela aparece quando você silencia.","Antes de decidir, respire e pergunte o que você sente de verdade."],
["A Imperatriz","Cuidado que floresce","É dia de nutrir: seu corpo, seus projetos e quem você ama.","Faça algo bonito por você, sem precisar de motivo."],
["O Imperador","Estrutura e firmeza","Organizar traz paz. Limites claros protegem o que importa.","Diga um não que você vem adiando."],
["O Hierofante","Sabedoria compartilhada","Alguém mais experiente pode encurtar seu caminho hoje.","Peça um conselho ou volte a um ensinamento que te fez bem."],
["Os Enamorados","Escolha com o coração","Uma decisão pede que você seja fiel aos seus valores.","Escolha o que combina com quem você quer ser, não com o medo."],
["O Carro","Avance com foco","O movimento está a seu favor quando você segura as rédeas.","Defina uma meta para hoje e não se distraia com o resto."],
["A Força","Firmeza doce","A verdadeira força hoje é a calma, não a briga.","Responda com gentileza onde antes você reagiria."],
["O Eremita","Um tempo só seu","Recolher-se não é fugir: é se reencontrar.","Reserve alguns minutos sem tela e sem ninguém."],
["A Roda da Fortuna","Ciclos virando","Algo está mudando de lugar. Aceitar o giro deixa tudo mais leve.","Solte o controle de uma situação que não depende de você."],
["A Justiça","Equilíbrio e verdade","O que é justo tende a se ajeitar. Seja honesta consigo.","Reveja um acordo, uma conta ou uma promessa pendente."],
["O Enforcado","Outro ângulo","Pausar e olhar diferente revela uma saída que você não via.","Antes de insistir, mude a pergunta."],
["A Morte","Fim que abre espaço","Algo precisa terminar para o novo chegar. Não é perda, é renovação.","Desapegue de um hábito, objeto ou pensamento que já pesou demais."],
["A Temperança","Medida certa","Nem oito nem oitenta: o meio-termo traz saúde e paz.","Equilibre o dia entre fazer e descansar."],
["O Diabo","Olhe para o que prende","Um apego ou excesso pede atenção, sem culpa.","Perceba o que você faz no automático e escolha diferente uma vez."],
["A Torre","Verdades que libertam","Uma surpresa pode sacudir, mas tira do caminho o que era frágil.","Se algo cair hoje, pergunte o que ficou de pé."],
["A Estrela","Esperança renovada","Depois da tempestade, a luz volta. Confie no seu ritmo.","Escreva um desejo e guarde num lugar especial."],
["A Lua","Intuição e névoa","Nem tudo está claro, e tudo bem. Sua intuição enxerga no escuro.","Anote um sonho ou pressentimento antes de dormir."],
["O Sol","Alegria simples","Dia de brilho, clareza e vontade de estar com gente querida.","Compartilhe uma conquista, por menor que seja."],
["O Julgamento","Chamado interior","Algo dentro de você pede para renascer e ser ouvido.","Retome um sonho que você tinha deixado de lado."],
["O Mundo","Ciclo completo","Uma etapa se fecha com sensação de missão cumprida.","Comemore o caminho até aqui antes de pensar no próximo."]];
function hashTxt(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function hojeLocal(t){var d=new Date(t||Date.now());return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function cartaDoDia(semente,t){var i=hashTxt(semente+"|"+hojeLocal(t))%ORACULO.length,c=ORACULO[i];return{indice:i,nome:c[0],tema:c[1],texto:c[2],conselho:c[3]}}
/* sintonia */
var ELEM=["fogo","terra","ar","água"];
function aspecto(a,b){var d=Math.abs(((a-b+540)%360)-180);
 if(d<=8)return{t:"conj",v:0.8};if(Math.abs(d-120)<=8)return{t:"trig",v:1};if(Math.abs(d-60)<=6)return{t:"sext",v:0.7};
 if(Math.abs(d-90)<=7)return{t:"quad",v:-0.6};if(d>=172)return{t:"opos",v:-0.2};
 var ea=Math.floor(a/30)%4,eb=Math.floor(b/30)%4;if(ea==eb)return{t:"elem",v:0.5};if(ea!=eb&&ea%2==eb%2)return{t:"comp",v:0.3};return{t:"neutro",v:-0.1}}
var FRASE={conj:"se misturam, intensidade e espelho",trig:"fluem com facilidade, como velhos conhecidos",sext:"se ajudam e criam oportunidades",quad:"geram atrito que faz crescer, se houver diálogo",opos:"se atraem pelos opostos e se completam quando há equilíbrio",elem:"falam a mesma língua",comp:"combinam bem e se estimulam",neutro:"são diferentes e pedem paciência para se entender"};
function sintonia(A,B,nomeB){var nb=nomeB||"a outra pessoa",P=[["Os dois Sóis","identidade",A.sun,B.sun,2],["As duas Luas","emoções",A.moon,B.moon,2],["Seu Sol e a Lua de "+nb,"acolhimento",A.sun,B.moon,1.5],["Sua Lua e o Sol de "+nb,"acolhimento",A.moon,B.sun,1.5]];
 if(A.asc!=null&&B.asc!=null)P.push(["Os Ascendentes","primeira impressão",A.asc,B.asc,1]);
 var s=0,w=0,linhas=[];for(var i=0;i<P.length;i++){var p=P[i],x=aspecto(p[2],p[3]);s+=x.v*p[4];w+=p[4];linhas.push({par:p[0],tema:p[1],tipo:x.t,texto:p[0]+" "+FRASE[x.t]+"."})}
 var pct=Math.round(Math.max(35,Math.min(97,58+40*s/w)));
 var titulo=pct>=85?"Sintonia rara":pct>=72?"Muita afinidade":pct>=60?"Boa combinação":pct>=48?"Combinação de aprendizado":"Desafio que ensina";
 return{pct:pct,titulo:titulo,linhas:linhas}}
export{ORACULO,cartaDoDia,sintonia,aspecto};
