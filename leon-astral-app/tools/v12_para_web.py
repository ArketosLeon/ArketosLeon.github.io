"""Transforma a demo v12 (login simulado) na versão web oficial do Leon Astral:
login Google real (Supabase), perfil salvo, biblioteca do banco, Estela pela
edge function com IA (com respostas locais de reserva), botão de denunciar,
exclusão de conta, sair e links legais."""
import sys

src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()

def troca(velho, novo, n=1):
    global h
    assert h.count(velho) == n, (velho[:60], h.count(velho))
    h = h.replace(velho, novo)

# 1. sem faixa de demonstração
troca('<div class="demo">Demonstração: login e mensagens são simulados.</div>\n', '')

# 2. supabase + estilos extras
troca('</head>', '''<style>
.rep{display:block;margin-top:6px;background:none;border:0;padding:0;color:var(--soft);font-size:12px;cursor:pointer;text-decoration:underline}
.btn.ghost{justify-content:center;background:transparent}
.btn.danger{justify-content:center;color:#F2A7B3;border-color:rgba(242,167,179,.35)}
.legal{font-size:12px;color:var(--soft);text-align:center;margin:10px 20px 0}.legal a{color:var(--soft)}
.erro{color:#F2A7B3;font-size:14px;text-align:center;margin:10px 20px 0}
</style>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
</head>''')

# 3. erro de login + links legais na tela de entrada
troca('<p class="note" style="margin-top:22px">Leon Astral · um produto Arktos Leon</p>',
      '<p class="erro hidden" id="authErr" role="alert"></p>\n  <p class="note" style="margin-top:22px">Leon Astral · um produto Arktos Leon</p>\n  <p class="legal"><a href="privacidade.html">Privacidade</a> · <a href="termos.html">Termos</a></p>')

# 4. mensagem de erro no cadastro
troca('<button class="btn gold" type="submit">Ver meu céu ✨</button>\n    </form>',
      '<button class="btn gold" type="submit">Ver meu céu ✨</button>\n    </form>\n    <p class="erro hidden" id="cadErr" role="alert"></p>')

# 5. conta: sair e excluir na aba Mapa
troca('<div class="pad"><button class="btn" id="redo" style="justify-content:center">Editar meus dados</button></div>',
      '''<div class="pad stack"><button class="btn" id="redo" style="justify-content:center">Editar meus dados</button>
    <button class="btn ghost" id="sair">Sair</button>
    <button class="btn danger" id="excluir">Excluir minha conta</button>
    <p class="legal" style="margin:0"><a href="privacidade.html">Privacidade</a> · <a href="termos.html">Termos</a> · <a href="privacidade.html#excluir">Como excluímos seus dados</a></p></div>''')

# 6. JavaScript: login real, cadastro salvo, boot
troca('''$("authBtns").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;b.lastChild.textContent=" Conectando…";setTimeout(()=>show("s-cad"),650)});
$("cadForm").addEventListener("submit",e=>{e.preventDefault();U={nm:$("nm").value.trim(),dt:$("dt").value,hr:$("hr").value,c:+$("cy").value};start()});
$("redo").addEventListener("click",()=>{$("tabs").classList.add("hidden");$("topbar").classList.add("hidden");$("msgs").innerHTML="";show("s-cad")});''',
'''/* servidor */
const SB_URL="https://rimgeohwknrwgvjburqq.supabase.co",SB_KEY="sb_publishable_hGhoAsyK38YhewKqXmy3-g_Is__vBCQ";
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY):null;
let UID=null;
const erro=(id,t)=>{const e=$(id);e.textContent=t;e.classList.toggle("hidden",!t)};
async function carregaBiblioteca(){if(!sb)return;const{data,error}=await sb.from("biblioteca").select("tipo,indice,texto,extra");if(error||!data)return;
  data.forEach(r=>{if(r.tipo==="sol")SOL[r.indice]=r.texto;if(r.tipo==="lua")LUA[r.indice]=r.texto;if(r.tipo==="asc"&&r.extra&&r.extra.adjetivos)ASC[r.indice]=r.extra.adjetivos;
    if(r.tipo==="casa_transito")CASA[r.indice]={t:CASA[r.indice].t,f:r.texto,c:r.extra.cuidado,p:r.extra.pergunta}})}
async function chamar(fn,body){const{data:{session}}=await sb.auth.getSession();if(!session)throw new Error("sessão expirada");
  const r=await fetch(`${SB_URL}/functions/v1/${fn}`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SB_KEY,Authorization:"Bearer "+session.access_token},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.erro||("erro "+r.status));return j}

$("authBtns").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;erro("authErr","");
  if(!sb){erro("authErr","Sem conexão com o servidor. Tente de novo.");return}
  const lbl=b.lastChild,orig=lbl.textContent;lbl.textContent=" Conectando…";
  const{error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
  if(error){lbl.textContent=orig;erro("authErr","Não deu para entrar agora: "+error.message)}});

$("cadForm").addEventListener("submit",async e=>{e.preventDefault();erro("cadErr","");
  U={nm:$("nm").value.trim(),dt:$("dt").value,hr:$("hr").value,c:+$("cy").value};
  const btn=e.submitter;if(btn){btn.disabled=true;btn.textContent="Salvando…"}
  if(sb&&UID){const c=CID[U.c],ch=calc(U);
    const r1=await sb.from("perfis").upsert({id:UID,nome:U.nm,data_nasc:U.dt,hora_nasc:U.hr||null,cidade:c[0],lat:c[1],lon:c[2],tz_offset:ch.offset,consentimento_lgpd:true,consentimento_em:new Date().toISOString()});
    const r2=r1.error?r1:await sb.from("mapas").upsert({user_id:UID,sol_lon:ch.sun,lua_lon:ch.moon,asc_lon:ch.asc,sol_signo:sg(ch.sun),lua_signo:sg(ch.moon),asc_signo:ch.asc==null?null:sg(ch.asc),fonte:"motor_v2",calculado_em:new Date().toISOString()});
    if(r2.error){if(btn){btn.disabled=false;btn.textContent="Ver meu céu ✨"}erro("cadErr","Não consegui salvar: "+r2.error.message);return}}
  if(btn){btn.disabled=false;btn.textContent="Ver meu céu ✨"}start()});

$("redo").addEventListener("click",()=>{if(U){$("nm").value=U.nm;$("dt").value=U.dt;$("hr").value=U.hr||"";$("cy").value=U.c}
  $("tabs").classList.add("hidden");$("topbar").classList.add("hidden");$("msgs").innerHTML="";show("s-cad")});
$("sair").addEventListener("click",async()=>{if(sb)await sb.auth.signOut();location.reload()});
$("excluir").addEventListener("click",async()=>{
  if(!confirm("Excluir sua conta apaga seu perfil, seu mapa, suas conversas com a Estela e seus horóscopos. Isso não pode ser desfeito. Continuar?"))return;
  const b=$("excluir");b.disabled=true;b.textContent="Excluindo…";
  try{await chamar("excluir-conta",{confirmar:true});await sb.auth.signOut().catch(()=>{});alert("Sua conta e seus dados foram excluídos.");location.reload()}
  catch(err){b.disabled=false;b.textContent="Excluir minha conta";alert("Não consegui excluir agora: "+err.message+". Tente de novo ou escreva para arktos.leon.ia@gmail.com.")}});

async function boot(){
  await carregaBiblioteca();
  if(!sb)return;
  const{data:{session}}=await sb.auth.getSession();if(!session)return;
  UID=session.user.id;
  const{data:p}=await sb.from("perfis").select("*").eq("id",UID).maybeSingle();
  if(!p){const md=session.user.user_metadata||{},nome=md.full_name||md.name||"";$("nm").value=nome.split(" ")[0]||"";show("s-cad");return}
  const ci=Math.max(0,CID.findIndex(c=>c[0]===p.cidade));
  U={nm:p.nome,dt:p.data_nasc,hr:p.hora_nasc?p.hora_nasc.slice(0,5):"",c:ci};start();
}
if(sb)sb.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_IN"&&!UID)boot()});''')

# 7. Estela pela IA, com reserva local, e botão de denunciar
troca('''function add(txt,who){const d=document.createElement("div");d.className="m "+who;d.textContent=txt;const t=document.createElement("time");t.textContent=hora();d.appendChild(t);$("msgs").appendChild(d);$("msgs").scrollTop=1e9}''',
'''function add(txt,who,mid){const d=document.createElement("div");d.className="m "+who;d.textContent=txt;const t=document.createElement("time");t.textContent=hora();d.appendChild(t);
  if(who==="t"&&UID){const r=document.createElement("button");r.type="button";r.className="rep";r.textContent="Denunciar resposta";
    r.onclick=async()=>{const motivo=prompt("O que há de errado com esta resposta? (opcional)");if(motivo===null)return;
      const{error}=await sb.from("denuncias").insert({user_id:UID,mensagem_id:mid||null,texto:txt.slice(0,2000),motivo:(motivo||"").slice(0,500)||null});
      r.textContent=error?"Não foi possível enviar":"Denúncia enviada. Obrigada!";r.disabled=true};d.appendChild(r)}
  $("msgs").appendChild(d);$("msgs").scrollTop=1e9}''')
troca('''function bot(txt,ms=900){$("st").textContent="digitando…";setTimeout(()=>{$("st").textContent="Online com seu Mapa Astral";add(txt,"t")},ms)}''',
      '''function bot(txt,ms=900,mid){$("st").textContent="digitando…";setTimeout(()=>{$("st").textContent="Online com seu Mapa Astral";add(txt,"t",mid)},ms)}''')
troca('''function user(txt){add(txt,"u");bot(resp(norm(txt)),900+Math.random()*600)}''',
'''async function user(txt){add(txt,"u");
  if(sb&&UID){$("st").textContent="digitando…";
    try{const j=await chamar("estela",{texto:txt,contexto:{sol:TD.s,lua:TD.m,asc:TD.a,luaHoje:TD.tm,casa:TD.ca,tema:TD.H.t,fase:TD.fase}});
      if(!j.fallback&&j.texto){$("st").textContent="Online com seu Mapa Astral";add(j.texto,"t",j.id);return}}catch(e){}}
  bot(resp(norm(txt)),900+Math.random()*600)}''')

# 8. iniciar
troca('</script>\n</body>', 'boot();\n}\n</script>\n</body>') if h.count('}\n</script>\n</body>') == 0 else None
h = h.replace('}\n</script>\n</body>', 'boot();\n}\n</script>\n</body>', 1) if 'boot();\n}\n</script>' not in h else h

open(dst, "w", encoding="utf-8").write(h)
print("ok", len(h))
