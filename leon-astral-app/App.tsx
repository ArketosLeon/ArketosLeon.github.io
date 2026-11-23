// Leon Astral — app Android (Expo), design v12
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share,
  StyleSheet, Switch, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useFonts, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Session } from '@supabase/supabase-js';
import { sb, entrarComGoogle, carregarBiblioteca, chamar } from './src/supabase';
import { T, GRAD, F } from './src/theme';
import { evento, identificar, sair, Sentry } from './src/telemetria';
import { cartaDoDia, sintonia } from './src/extras';
import { calcular, ceuAgora, cidades as CIDADES, sg, Mapa, Perfil } from './src/astro';
import { ASC, CASAS, ELEMENTOS, GLIFOS, LUA, SIGNOS, SOL } from './src/content';
import { respostaEstela, Dia } from './src/estela';
import { registrarPush, removerPush } from './src/push';
import Wheel from './src/Wheel';

type Aba = 'hoje' | 'oraculo' | 'sintonia' | 'mapa';
type Msg = { id: string; de: 'eu' | 'estela'; texto: string; hora: string; mid?: number | null; denunciada?: boolean };

const SITE = 'https://arketosleon.github.io/leon-astral/';
const CORES = ['Vermelho rubi', 'Verde musgo', 'Amarelo claro', 'Prata', 'Dourado', 'Bege areia', 'Rosa quartzo', 'Vinho', 'Roxo', 'Grafite', 'Azul elétrico', 'Lilás'];
const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default Sentry.wrap(App);

function App() {
  const [fontes] = useFonts({ Cinzel_600SemiBold, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold });
  return (
    <SafeAreaProvider>
      <Fundo />
      {fontes ? <Root /> : <View style={[s.fill, s.center]}><ActivityIndicator color={T.lav} size="large" /></View>}
    </SafeAreaProvider>
  );
}

// céu de meia-noite com nebulosa e poucas estrelas (visual leve)
function Fundo() {
  const { width, height } = useWindowDimensions();
  const estrelas = useMemo(() => {
    let q = 7; const r = () => (q = (q * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: Math.min(120, Math.round((width * height) / 6000)) }, (_, i) => ({ x: r() * width, y: r() * height, z: r(), ouro: i % 3 !== 0 }));
  }, [width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#141029', T.bg, '#0B0E17', '#161032']} locations={[0, 0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {estrelas.map((e, i) => (
          <Circle key={i} cx={e.x} cy={e.y} r={e.z * 1.3 + 0.2} fill={e.ouro ? `rgba(243,198,143,${0.25 + e.z * 0.55})` : `rgba(190,165,250,${0.25 + e.z * 0.55})`} />
        ))}
      </Svg>
    </View>
  );
}

function Root() {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [notificar, setNotificar] = useState(true);
  const [editando, setEditando] = useState(false);
  const [aba, setAba] = useState<Aba>('hoje');

  useEffect(() => {
    carregarBiblioteca().catch(() => {});
    sb.auth.getSession().then(({ data }) => setSessao(data.session)).finally(() => setCarregando(false));
    const { data: sub } = sb.auth.onAuthStateChange((_e, sess) => { setSessao(sess); if (sess) identificar(sess.user.id); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao) { setPerfil(null); return; }
    setCarregando(true);
    sb.from('perfis').select('*').eq('id', sessao.user.id).maybeSingle().then(({ data: p }) => {
      if (p) {
        const ci = Math.max(0, CIDADES.findIndex((c) => c[0] === p.cidade));
        setPerfil({ nome: p.nome, data: p.data_nasc, hora: p.hora_nasc ? p.hora_nasc.slice(0, 5) : '', cidade: ci });
        setNotificar(p.notificar_diario !== false);
        if (p.notificar_diario !== false) registrarPush(sessao.user.id);
      } else setPerfil(null);
      setCarregando(false);
    });
  }, [sessao]);

  const mapa: Mapa | null = useMemo(() => (perfil ? calcular(perfil) : null), [perfil]);
  const dia: Dia | null = useMemo(() => {
    if (!mapa) return null;
    const c = ceuAgora(), tm = c.luaSigno, s0 = sg(mapa.sun);
    return { s: s0, m: sg(mapa.moon), a: mapa.asc != null ? sg(mapa.asc) : null, tm, ca: (tm - s0 + 12) % 12, ceu: c };
  }, [mapa]);

  if (carregando) return <View style={[s.fill, s.center]}><ActivityIndicator color={T.lav} size="large" /></View>;

  return (
    <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      {!sessao ? (
        <Login />
      ) : !perfil || editando ? (
        <Cadastro sessao={sessao} inicial={perfil} onSalvo={(p) => {
          evento('cadastro_concluido', { com_hora: !!p.hora }); setPerfil(p); setEditando(false); setAba('hoje');
          if (notificar) registrarPush(sessao.user.id);
        }} />
      ) : mapa && dia ? (
        <>
          <Topo dia={dia} />
          <View style={s.fill}>
            {aba === 'hoje' && <Hoje perfil={perfil} dia={dia} uid={sessao.user.id} />}
            {aba === 'oraculo' && <Oraculo perfil={perfil} dia={dia} uid={sessao.user.id} />}
            {aba === 'sintonia' && <Sintonia mapa={mapa} dia={dia} />}
            {aba === 'mapa' && (
              <MeuMapa perfil={perfil} mapa={mapa} dia={dia} uid={sessao.user.id} notificar={notificar}
                onNotificar={async (v) => {
                  setNotificar(v);
                  await sb.from('perfis').update({ notificar_diario: v }).eq('id', sessao.user.id);
                  if (v) registrarPush(sessao.user.id); else removerPush(sessao.user.id);
                }}
                onEditar={() => setEditando(true)} />
            )}
          </View>
          <View style={s.tabs} accessibilityRole="tablist">
            {([['hoje', '☼', 'Hoje'], ['oraculo', '✧', 'Oráculo'], ['sintonia', '♡', 'Sintonia'], ['mapa', '◎', 'Mapa']] as const).map(([k, g, l]) => {
              const on = aba === k;
              return (
                <Pressable key={k} style={[s.tab, on && s.tabOn]} onPress={() => { setAba(k); evento('aba_vista', { aba: k }); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={l}>
                  <Text style={[s.tabG, on && { color: T.gold }]}>{g}</Text>
                  <Text style={[s.tabL, on && { color: T.ink, fontFamily: F.forte }]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}

function Topo({ dia }: { dia: Dia }) {
  return (
    <View style={s.topo}>
      <Image source={require('./assets/icon.png')} style={s.topoImg} accessibilityIgnoresInvertColors />
      <View>
        <Text style={s.topoT}>LEON ASTRAL</Text>
        <Text style={s.small}>Sol em {SIGNOS[dia.s]} · {dia.ceu.fase}</Text>
      </View>
    </View>
  );
}

function Btn({ titulo, onPress, ouro, perigo, carregando, icone }: { titulo: string; onPress: () => void; ouro?: boolean; perigo?: boolean; carregando?: boolean; icone?: React.ReactNode }) {
  const conteudo = carregando ? <ActivityIndicator color={ouro ? '#1B1530' : T.ink} /> : (
    <>{icone}<Text style={[s.btnTxt, ouro && { color: '#1B1530' }, perigo && { color: T.danger }]}>{titulo}</Text></>
  );
  return (
    <Pressable onPress={onPress} disabled={carregando} accessibilityRole="button" accessibilityLabel={titulo} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {ouro ? (
        <LinearGradient colors={GRAD as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, s.btnOuro]}>{conteudo}</LinearGradient>
      ) : (
        <View style={[s.btn, perigo && { borderColor: 'rgba(242,167,179,0.35)', backgroundColor: 'transparent' }]}>{conteudo}</View>
      )}
    </Pressable>
  );
}

const Vidro = ({ children, style }: { children: React.ReactNode; style?: any }) => <View style={[s.vidro, style]}>{children}</View>;

function Item({ g, k, v }: { g: string; k: string; v: string }) {
  return (
    <View style={s.item}>
      <Text style={s.itemG}>{g}</Text>
      <View style={{ flex: 1 }}><Text style={s.k}>{k}</Text><Text style={s.body}>{v}</Text></View>
    </View>
  );
}

function Legal() {
  return (
    <Text style={[s.small, { textAlign: 'center', marginTop: 14 }]}>
      <Text style={s.link} onPress={() => Linking.openURL(SITE + 'privacidade.html')}>Privacidade</Text> · <Text style={s.link} onPress={() => Linking.openURL(SITE + 'termos.html')}>Termos</Text>
    </Text>
  );
}

function Login() {
  const { width } = useWindowDimensions();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const entrar = async () => {
    setErro(''); setOcupado(true);
    try { await entrarComGoogle(); } catch (e: any) { setErro(`Não deu para entrar: ${e?.message ?? 'erro'}`); } finally { setOcupado(false); }
  };
  const tam = Math.min(width * 0.72, 280);
  return (
    <ScrollView contentContainerStyle={[s.pad, { paddingTop: 36 }]}>
      <View style={[s.center, s.heroSombra]}>
        <Image source={require('./assets/icon.png')} style={{ width: tam, height: tam, borderRadius: tam / 2 }} accessibilityLabel="Símbolo de Leão dourado cercado pelos 12 signos" />
      </View>
      <Text style={s.h1}>Leon Astral</Text>
      <Text style={[s.muted, { textAlign: 'center', marginBottom: 24 }]}>Seu horóscopo feito com o seu mapa astral. E a Estela, sua astróloga de bolso, sempre por perto.</Text>
      <Btn titulo="Continuar com Google" onPress={entrar} carregando={ocupado} icone={<Text style={s.gIcon}>G</Text>} />
      {!!erro && <Text style={s.erro} accessibilityRole="alert">{erro}</Text>}
      <Text style={[s.small, { textAlign: 'center', marginTop: 22 }]}>Leon Astral · um produto Arktos Leon</Text>
      <Legal />
    </ScrollView>
  );
}

const isoParaBr = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');
const brParaIso = (br: string) => { const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const mascaraData = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
const mascaraHora = (v: string) => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2');
const semAc = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Cidades({ cidade, setCidade, max = 12 }: { cidade: number; setCidade: (i: number) => void; max?: number }) {
  const [busca, setBusca] = useState('');
  const lista = CIDADES.map((c, i) => [c, i] as const).filter(([c]) => !busca || semAc(c[0] + ' ' + c[4]).includes(semAc(busca))).slice(0, busca ? 20 : max);
  return (
    <>
      <TextInput style={s.input} value={busca} onChangeText={setBusca} placeholder={`Buscar cidade (selecionada: ${CIDADES[cidade][0]})`} placeholderTextColor={T.soft} />
      <View style={s.chips}>
        {lista.map(([c, i]) => (
          <Pressable key={c[0]} onPress={() => setCidade(i)} style={[s.chip, cidade === i && s.chipOn]} accessibilityRole="radio" accessibilityState={{ checked: cidade === i }}>
            <Text style={[s.chipTxt, cidade === i && { color: T.ink }]}>{c[0]} · {c[4]}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Cadastro({ sessao, inicial, onSalvo }: { sessao: Session; inicial: Perfil | null; onSalvo: (p: Perfil) => void }) {
  const meta: any = sessao.user.user_metadata ?? {};
  const [nome, setNome] = useState(inicial?.nome ?? String(meta.full_name ?? meta.name ?? '').split(' ')[0]);
  const [data, setData] = useState(isoParaBr(inicial?.data ?? ''));
  const [hr, setHr] = useState(inicial?.hora ?? '');
  const [cidade, setCidade] = useState(inicial?.cidade ?? 0);
  const [ok, setOk] = useState(!!inicial);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const iso = brParaIso(data);
    if (!nome.trim()) return setErro('Escreva como posso te chamar.');
    if (!iso || isNaN(Date.parse(iso))) return setErro('Data no formato DD/MM/AAAA.');
    if (hr && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hr)) return setErro('Hora no formato HH:MM, ou deixe em branco.');
    if (!ok) return setErro('Para continuar, aceite o uso dos dados.');
    setErro(''); setSalvando(true);
    const p: Perfil = { nome: nome.trim(), data: iso, hora: hr, cidade };
    const c = CIDADES[cidade], m = calcular(p), uid = sessao.user.id;
    const r1 = await sb.from('perfis').upsert({ id: uid, nome: p.nome, data_nasc: iso, hora_nasc: hr || null, cidade: c[0], lat: c[1], lon: c[2], tz_offset: m.offset, consentimento_lgpd: true, consentimento_em: new Date().toISOString() });
    const r2 = r1.error ? r1 : await sb.from('mapas').upsert({ user_id: uid, sol_lon: m.sun, lua_lon: m.moon, asc_lon: m.asc, sol_signo: sg(m.sun), lua_signo: sg(m.moon), asc_signo: m.asc == null ? null : sg(m.asc), fonte: 'motor_v2', calculado_em: new Date().toISOString() });
    setSalvando(false);
    if (r2.error) return setErro('Não consegui salvar: ' + r2.error.message);
    onSalvo(p);
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <Text style={s.h2}>Quando você nasceu?</Text>
        <Text style={[s.muted, { marginBottom: 16 }]}>Com data, hora e cidade eu desenho seu céu: Sol, Lua e Ascendente.</Text>
        <Text style={s.label}>Como posso te chamar?</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor={T.soft} autoComplete="given-name" />
        <Text style={s.label}>Data de nascimento</Text>
        <TextInput style={s.input} value={data} onChangeText={(v) => setData(mascaraData(v))} placeholder="DD/MM/AAAA" placeholderTextColor={T.soft} keyboardType="number-pad" />
        <Text style={s.label}>Hora de nascimento <Text style={s.small}>(se não souber, deixe em branco)</Text></Text>
        <TextInput style={s.input} value={hr} onChangeText={(v) => setHr(mascaraHora(v))} placeholder="HH:MM" placeholderTextColor={T.soft} keyboardType="number-pad" />
        <Text style={s.label}>Cidade de nascimento</Text>
        <Cidades cidade={cidade} setCidade={setCidade} />
        <Text style={s.small}>Não achou? Escolha a cidade grande mais próxima, no mesmo estado.</Text>
        <View style={[s.row, { marginTop: 16 }]}>
          <Switch value={ok} onValueChange={setOk} trackColor={{ true: T.lav, false: 'rgba(255,255,255,0.15)' }} thumbColor={ok ? T.gold : '#ccc'} accessibilityLabel="Aceito o uso dos meus dados" />
          <Text style={[s.body, { flex: 1 }]}>Aceito o uso dos meus dados de nascimento para gerar meu horóscopo (LGPD).</Text>
        </View>
        {!!erro && <Text style={s.erro} accessibilityRole="alert">{erro}</Text>}
        <View style={{ marginTop: 14 }}><Btn titulo="Ver meu céu ✨" ouro onPress={salvar} carregando={salvando} /></View>
        <Text style={[s.small, { marginTop: 14 }]}>Entretenimento e autoconhecimento. Não substitui ajuda profissional.</Text>
        <Legal />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const quando = (t: number) => {
  const d = new Date(t), hoje = new Date();
  const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dd = Math.round((new Date(d.toDateString()).getTime() - new Date(hoje.toDateString()).getTime()) / 864e5);
  return dd === 0 ? `hoje às ${hh}` : dd === 1 ? `amanhã às ${hh}` : `${d.toLocaleDateString('pt-BR', { weekday: 'long' })} às ${hh}`;
};

function Hoje({ perfil, dia, uid }: { perfil: Perfil; dia: Dia; uid: string }) {
  const H = CASAS[dia.ca], mesmo = dia.tm % 4 === dia.s % 4;
  const carta = useMemo(() => cartaDoDia(uid, Date.now()), [uid]);
  const [virada, setVirada] = useState(false);
  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const num = ((new Date().getDate() + dia.s) % 9) + 1, comp = (dia.s + 4) % 12;
  const compartilhar = () => {
    evento('story_compartilhado');
    Share.share({ message: `✧ ${SIGNOS[dia.s]} hoje: ${H.f}\n${dia.ceu.fase} em ${SIGNOS[dia.tm]}.\n\nMeu horóscopo pelo mapa astral no Leon Astral: ${SITE}` });
  };
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[s.center, { marginTop: 8 }]}>
        <View style={s.orb}><Text style={s.orbG}>{GLIFOS[dia.s]}</Text></View>
      </View>
      <View style={[s.pad, { paddingTop: 6, alignItems: 'center' }]}>
        <Text style={s.kCentro}>{data}</Text>
        <Text style={[s.h2, { textAlign: 'center' }]}>{perfil.nome}, hoje é dia de {H.t.toLowerCase()}</Text>
      </View>
      <Vidro>
        <Text style={s.body}>A Lua em <Text style={{ fontFamily: F.forte }}>{SIGNOS[dia.tm]}</Text> atravessa sua casa {dia.ca + 1}. {mesmo ? 'É o mesmo elemento do seu Sol: o dia flui com você.' : 'Elemento diferente do seu Sol: vá com mais calma.'}</Text>
        <Item g="✦" k="Conselho do dia" v={H.f} />
        <Item g="☽" k="Fase da Lua" v={`${dia.ceu.fase} em ${SIGNOS[dia.tm]} · entra em ${SIGNOS[dia.ceu.proxSigno]} ${quando(dia.ceu.trocaEm)}`} />
        <Item g="⚠" k="Cuidado com" v={H.c} />
        <Item g="?" k="Pergunta para você" v={H.p} />
        <View style={s.aff}>
          {[['Cor', CORES[(dia.s + dia.tm) % 12]], ['Número', String(num)], ['Sintonia', SIGNOS[comp]]].map(([k, v]) => (
            <View key={k} style={s.affI}><Text style={s.small}>{k}</Text><Text style={[s.body, { fontFamily: F.forte, color: T.gold }]}>{v}</Text></View>
          ))}
        </View>
      </Vidro>
      <Text style={[s.h2, { marginHorizontal: 20, marginTop: 12 }]}>Carta do dia</Text>
      <Pressable onPress={() => { if (!virada) { setVirada(true); evento('carta_virada', { carta: carta.indice }); } }} accessibilityRole="button" accessibilityLabel={virada ? `Carta do dia: ${carta.nome}` : 'Toque para revelar a carta do dia'}>
        <Vidro>
          {virada ? (
            <>
              <Text style={s.k}>{carta.tema}</Text>
              <Text style={[s.h2, { color: T.gold, marginVertical: 4 }]}>{carta.nome}</Text>
              <Text style={s.body}>{carta.texto}</Text>
              <Item g="✦" k="Conselho" v={carta.conselho} />
            </>
          ) : (
            <View style={[s.center, { paddingVertical: 22 }]}>
              <Text style={{ fontSize: 44, color: T.gold }}>✧</Text>
              <Text style={[s.body, { textAlign: 'center' }]}>Respire, pense no seu dia e toque para revelar sua carta.</Text>
            </View>
          )}
        </Vidro>
      </Pressable>
      <View style={s.pad}><Btn titulo="Compartilhar no Story ✨" ouro onPress={compartilhar} /></View>
    </ScrollView>
  );
}

const CHIPS = ['Conselho de hoje', 'Amor este mês', 'Ele vai me procurar?', 'Trabalho e dinheiro', 'Meu ascendente'];

function Oraculo({ perfil, dia, uid }: { perfil: Perfil; dia: Dia; uid: string }) {
  const H = CASAS[dia.ca];
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 'a', de: 'estela', hora: hora(), texto: `Oi, ${perfil.nome} ✧ Eu sou a Estela.\nJá li o seu céu: Sol em ${SIGNOS[dia.s]}, Lua em ${SIGNOS[dia.m]}${dia.a != null ? ' e Ascendente em ' + SIGNOS[dia.a] : ''}.` },
    { id: 'b', de: 'estela', hora: hora(), texto: `Hoje a Lua está em ${SIGNOS[dia.tm]} e o tema do seu dia é ${H.t.toLowerCase()}.\n\nComo você está se sentindo?` },
  ]);
  const [txt, setTxt] = useState('');
  const [digitando, setDigitando] = useState(false);
  const lista = useRef<ScrollView>(null);

  // histórico salvo no servidor (as últimas 30 mensagens)
  useEffect(() => {
    sb.from('mensagens').select('id,origem,texto,criado_em').eq('user_id', uid).in('origem', ['usuario', 'estela']).order('criado_em', { ascending: false }).limit(30).then(({ data }) => {
      if (!data?.length) return;
      const ant: Msg[] = data.reverse().map((m: any) => ({ id: 'h' + m.id, mid: m.origem === 'estela' ? m.id : null, de: m.origem === 'estela' ? 'estela' : 'eu', texto: m.texto, hora: new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }));
      setMsgs((atual) => [...ant, ...atual]);
    });
  }, [uid]);

  const enviar = async (texto: string) => {
    const v = texto.trim(); if (!v || digitando) return;
    evento('mensagem_estela');
    setMsgs((m) => [...m, { id: String(Date.now()), de: 'eu', texto: v, hora: hora() }]);
    setTxt(''); setDigitando(true);
    let resposta: string | null = null, mid: number | null = null;
    try {
      const j = await chamar<{ texto?: string; id?: number; fallback?: boolean }>('estela', {
        texto: v, contexto: { sol: dia.s, lua: dia.m, asc: dia.a, luaHoje: dia.tm, casa: dia.ca, tema: H.t, fase: dia.ceu.fase },
      });
      if (!j.fallback && j.texto) { resposta = j.texto; mid = j.id ?? null; }
    } catch {}
    if (!resposta) { await new Promise((r) => setTimeout(r, 700)); resposta = respostaEstela(v, perfil.nome, dia); }
    setDigitando(false);
    setMsgs((m) => [...m, { id: String(Date.now() + 1), de: 'estela', texto: resposta!, hora: hora(), mid }]);
  };

  const denunciar = (m: Msg) => {
    Alert.alert('Denunciar resposta', 'Essa resposta foi ofensiva, perigosa ou errada? Vamos revisar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: async () => {
        const { error } = await sb.from('denuncias').insert({ user_id: uid, mensagem_id: m.mid ?? null, texto: m.texto.slice(0, 2000) });
        evento('resposta_denunciada');
        if (!error) setMsgs((l) => l.map((x) => (x.id === m.id ? { ...x, denunciada: true } : x)));
        else Alert.alert('Não foi possível enviar agora. Tente de novo.');
      } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
      <View style={s.chead}>
        <View style={s.av}><Image source={require('./assets/estela-avatar.png')} style={{ width: '100%', height: '100%' }} accessibilityLabel="Constelação de Andrômeda, avatar da Estela" /></View>
        <View>
          <Text style={[s.h3, { fontFamily: F.titulo }]}>Estela</Text>
          <Text style={[s.small, { color: digitando ? T.gold : '#7EE2A8' }]}>{digitando ? 'digitando…' : '● Online com seu Mapa Astral'}</Text>
        </View>
      </View>
      <ScrollView ref={lista} style={s.fill} contentContainerStyle={{ padding: 16, gap: 10 }} onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}>
        {msgs.map((m) => (
          <View key={m.id} style={[s.bolha, m.de === 'eu' ? s.bolhaEu : s.bolhaEla]}>
            <Text style={s.body}>{m.texto}</Text>
            <View style={[s.row, { justifyContent: 'space-between', marginTop: 4, gap: 12 }]}>
              {m.de === 'estela' && m.id !== 'a' && m.id !== 'b' ? (
                m.denunciada ? <Text style={s.small}>Denúncia enviada. Obrigada!</Text> :
                <Text style={[s.small, s.link]} onPress={() => denunciar(m)} accessibilityRole="button">Denunciar resposta</Text>
              ) : <View />}
              <Text style={s.small}>{m.hora}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }} style={{ flexGrow: 0, marginBottom: 8 }} keyboardShouldPersistTaps="handled">
        {CHIPS.map((c) => (
          <Pressable key={c} style={s.chip} onPress={() => enviar(c)}><Text style={[s.chipTxt, { color: T.ink }]}>{c}</Text></Pressable>
        ))}
      </ScrollView>
      <View style={s.envio}>
        <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={txt} onChangeText={setTxt} placeholder="Pergunte à Estela…" placeholderTextColor={T.soft} onSubmitEditing={() => enviar(txt)} returnKeyType="send" maxLength={1000} />
        <Pressable onPress={() => enviar(txt)} accessibilityRole="button" accessibilityLabel="Enviar">
          <LinearGradient colors={GRAD as unknown as string[]} style={s.enviar}><Text style={{ fontSize: 18, color: '#1B1530' }}>➤</Text></LinearGradient>
        </Pressable>
      </View>
      <Text style={[s.small, { textAlign: 'center', marginBottom: 6 }]}>A Estela é uma IA. Entretenimento e autoconhecimento.</Text>
    </KeyboardAvoidingView>
  );
}

function Barra({ rotulo, v }: { rotulo: string; v: number }) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.body}>{rotulo}</Text><Text style={[s.body, { color: T.gold }]}>{v}%</Text></View>
      <View style={s.trilho}><LinearGradient colors={GRAD as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${v}%`, borderRadius: 8 }} /></View>
    </View>
  );
}

function Sintonia({ mapa, dia }: { mapa: Mapa; dia: Dia }) {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hr, setHr] = useState('');
  const [cidade, setCidade] = useState(0);
  const [erro, setErro] = useState('');
  const [res, setRes] = useState<{ r: ReturnType<typeof sintonia>; b: number; nome: string } | null>(null);
  const ver = () => {
    const iso = brParaIso(data);
    if (!iso || isNaN(Date.parse(iso))) return setErro('Data no formato DD/MM/AAAA.');
    if (hr && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hr)) return setErro('Hora no formato HH:MM, ou deixe em branco.');
    setErro('');
    const outro = calcular({ nome, data: iso, hora: hr, cidade });
    const r = sintonia(mapa, outro, nome.trim() || 'a outra pessoa');
    setRes({ r, b: sg(outro.sun), nome: nome.trim() || 'Outra pessoa' });
    evento('sintonia_calculada', { pct: r.pct, com_hora: !!hr });
  };
  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={s.pad}>
          <Text style={s.h2}>Sintonia</Text>
          <Text style={s.muted}>Compare seu mapa com o de alguém: amor, amizade, família ou trabalho. Os dados da outra pessoa não são salvos.</Text>
        </View>
        {res ? (
          <Vidro>
            <View style={[s.row, { justifyContent: 'space-around' }]}>
              <View style={s.center}><Text style={s.signoG}>{GLIFOS[dia.s]}</Text><Text style={s.small}>Você</Text><Text style={[s.body, { fontFamily: F.forte }]}>{SIGNOS[dia.s]}</Text></View>
              <Text style={{ fontSize: 22, color: T.blush }}>♡</Text>
              <View style={s.center}><Text style={s.signoG}>{GLIFOS[res.b]}</Text><Text style={s.small}>{res.nome}</Text><Text style={[s.body, { fontFamily: F.forte }]}>{SIGNOS[res.b]}</Text></View>
            </View>
            <Text style={s.pct}>{res.r.pct}%</Text>
            <Text style={[s.muted, { textAlign: 'center' }]}>{res.r.titulo}</Text>
            <Barra rotulo="Emoções" v={res.r.linhas[1].pct} />
            <Barra rotulo="Identidade" v={res.r.linhas[0].pct} />
            <Barra rotulo="Acolhimento" v={Math.round((res.r.linhas[2].pct + res.r.linhas[3].pct) / 2)} />
            {res.r.linhas.map((l) => <Item key={l.par} g={l.tipo === 'quad' || l.tipo === 'opos' ? '△' : l.tipo === 'neutro' ? '○' : '♡'} k={l.tema} v={l.texto} />)}
            <View style={{ marginTop: 12 }}><Btn titulo="Comparar com outra pessoa" onPress={() => setRes(null)} /></View>
          </Vidro>
        ) : (
          <Vidro>
            <Text style={s.label}>Nome</Text>
            <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Ex.: Rafa" placeholderTextColor={T.soft} />
            <Text style={s.label}>Data de nascimento</Text>
            <TextInput style={s.input} value={data} onChangeText={(v) => setData(mascaraData(v))} placeholder="DD/MM/AAAA" placeholderTextColor={T.soft} keyboardType="number-pad" />
            <Text style={s.label}>Hora <Text style={s.small}>(opcional)</Text></Text>
            <TextInput style={s.input} value={hr} onChangeText={(v) => setHr(mascaraHora(v))} placeholder="HH:MM" placeholderTextColor={T.soft} keyboardType="number-pad" />
            <Text style={s.label}>Cidade de nascimento</Text>
            <Cidades cidade={cidade} setCidade={setCidade} max={6} />
            {!!erro && <Text style={s.erro}>{erro}</Text>}
            <View style={{ marginTop: 10 }}><Btn titulo="Ver nossa sintonia ♡" ouro onPress={ver} /></View>
          </Vidro>
        )}
        <Text style={[s.small, { textAlign: 'center', marginHorizontal: 20 }]}>Compara Sol, Lua e Ascendente dos dois mapas, com as posições reais do céu.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MeuMapa({ perfil, mapa, dia, uid, notificar, onNotificar, onEditar }: { perfil: Perfil; mapa: Mapa; dia: Dia; uid: string; notificar: boolean; onNotificar: (v: boolean) => void; onEditar: () => void }) {
  const { width } = useWindowDimensions();
  const [excluindo, setExcluindo] = useState(false);
  const trio = [
    ['Essência', 'Sol', dia.s, `${SOL[dia.s]}`],
    ['Emoções', 'Lua', dia.m, mapa.luaDupla ? `No dia em que você nasceu a Lua mudou de signo (${SIGNOS[mapa.luaDupla[0]]} → ${SIGNOS[mapa.luaDupla[1]]}). Sem a hora, considero ${SIGNOS[dia.m]}. ${LUA[dia.m]}` : LUA[dia.m]],
    ['Máscara social', 'Ascendente', dia.a, dia.a != null ? `As pessoas te percebem como alguém ${ASC[dia.a]}.` : 'Informe a hora de nascimento para revelar seu Ascendente.'],
  ] as const;

  const excluir = () => {
    Alert.alert('Excluir minha conta', 'Isso apaga seu perfil, seu mapa, suas conversas com a Estela e seus horóscopos. Não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir tudo', style: 'destructive', onPress: async () => {
        setExcluindo(true);
        try {
          await chamar('excluir-conta', { confirmar: true });
          evento('conta_excluida'); sair();
          await sb.auth.signOut().catch(() => {});
          Alert.alert('Conta excluída', 'Sua conta e seus dados foram apagados.');
        } catch (e: any) {
          setExcluindo(false);
          Alert.alert('Não consegui excluir agora', `${e?.message ?? 'erro'}. Tente de novo ou escreva para arktos.leon.ia@gmail.com.`);
        }
      } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={s.pad}><Text style={s.h2}>O céu de {perfil.nome}</Text></View>
      <View style={s.center}><Wheel size={Math.min(width - 40, 330)} sun={mapa.sun} moon={mapa.moon} asc={mapa.asc} today={dia.ceu.lua} /></View>
      {trio.map(([t, k, i, x]) => (
        <Vidro key={k} style={s.trio}>
          <Text style={s.trioG}>{i == null ? '?' : GLIFOS[i]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.k}>{t} · {k} em {i == null ? '—' : SIGNOS[i]}{k === 'Sol' ? ` · ${ELEMENTOS[dia.s % 4]}` : ''}</Text>
            <Text style={s.body}>{x}</Text>
          </View>
        </Vidro>
      ))}
      <Text style={[s.small, { textAlign: 'center', marginHorizontal: 20 }]}>Linha tracejada: a Lua de hoje, em {SIGNOS[dia.tm]}. Posições com o histórico oficial de fusos e horário de verão do Brasil.</Text>
      <View style={[s.pad, { gap: 10 }]}>
        <Vidro style={{ marginHorizontal: 0, marginVertical: 0 }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}><Text style={s.body}>Horóscopo do dia às 7h</Text><Text style={s.small}>Uma notificação por dia com o seu céu.</Text></View>
            <Switch value={notificar} onValueChange={onNotificar} trackColor={{ true: T.lav, false: 'rgba(255,255,255,0.15)' }} thumbColor={notificar ? T.gold : '#ccc'} accessibilityLabel="Receber o horóscopo do dia" />
          </View>
        </Vidro>
        <Btn titulo="Editar meus dados" onPress={onEditar} />
        <Btn titulo="Sair" onPress={() => { removerPush(uid); sair(); sb.auth.signOut(); }} />
        <Btn titulo="Excluir minha conta" perigo onPress={excluir} carregando={excluindo} />
        <Legal />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pad: { padding: 20 },
  h1: { fontFamily: F.titulo, fontSize: 34, color: T.ink, textAlign: 'center', marginTop: 18, marginBottom: 8, letterSpacing: 1 },
  h2: { fontFamily: F.titulo, fontSize: 22, color: T.ink, marginBottom: 6 },
  h3: { fontSize: 17, color: T.ink },
  body: { fontFamily: F.texto, fontSize: 15, lineHeight: 22, color: T.ink },
  muted: { fontFamily: F.texto, fontSize: 15, lineHeight: 22, color: T.soft },
  small: { fontFamily: F.texto, fontSize: 12.5, color: T.soft },
  k: { fontFamily: F.medio, fontSize: 12.5, color: T.gold, marginBottom: 2 },
  kCentro: { fontFamily: F.medio, fontSize: 13, color: T.gold, marginBottom: 4 },
  link: { textDecorationLine: 'underline', color: T.soft },
  erro: { fontFamily: F.medio, color: T.danger, marginTop: 10, textAlign: 'center' },
  label: { fontFamily: F.forte, fontSize: 14, color: T.ink, marginTop: 12, marginBottom: 6 },
  input: { fontFamily: F.texto, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: T.edge, backgroundColor: 'rgba(255,255,255,0.05)', color: T.ink, paddingHorizontal: 14, fontSize: 16, marginBottom: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 54, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: T.edge, backgroundColor: T.glass },
  btnOuro: { borderWidth: 0, shadowColor: '#A78BFA', shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  btnTxt: { fontFamily: F.forte, fontSize: 16, color: T.ink },
  gIcon: { fontFamily: F.forte, fontSize: 20, color: '#4285F4' },
  heroSombra: { shadowColor: '#F3C68F', shadowOpacity: 0.3, shadowRadius: 26 },
  vidro: { backgroundColor: T.glass, borderWidth: 1, borderColor: T.edge, borderRadius: 22, padding: 18, marginHorizontal: 20, marginVertical: 10 },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', marginTop: 8 },
  itemG: { width: 22, fontSize: 16, color: T.lav, textAlign: 'center', marginTop: 2 },
  aff: { flexDirection: 'row', gap: 8, marginTop: 12 },
  affI: { flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: T.edge, alignItems: 'center' },
  orb: { width: 132, height: 132, borderRadius: 66, borderWidth: 1.5, borderColor: 'rgba(243,198,143,0.7)', backgroundColor: 'rgba(167,139,250,0.10)', alignItems: 'center', justifyContent: 'center', shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 30, elevation: 10 },
  orbG: { fontSize: 58, color: T.gold },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10 },
  topoImg: { width: 34, height: 34, borderRadius: 17 },
  topoT: { fontFamily: F.titulo, fontSize: 15, color: T.ink, letterSpacing: 1.5 },
  tabs: { flexDirection: 'row', marginHorizontal: 14, marginBottom: 8, padding: 6, borderRadius: 22, backgroundColor: 'rgba(20,18,36,0.85)', borderWidth: 1, borderColor: T.edge },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16 },
  tabOn: { backgroundColor: 'rgba(167,139,250,0.16)' },
  tabG: { fontSize: 18, color: T.soft },
  tabL: { fontFamily: F.medio, fontSize: 12, color: T.soft, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(243,198,143,0.35)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipOn: { backgroundColor: 'rgba(167,139,250,0.25)', borderColor: T.lav },
  chipTxt: { fontFamily: F.medio, fontSize: 13.5, color: T.soft },
  chead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  av: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,160,224,0.6)', backgroundColor: '#141729' },
  bolha: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  bolhaEla: { alignSelf: 'flex-start', backgroundColor: T.lavGlass, borderColor: 'rgba(167,139,250,0.25)', borderTopLeftRadius: 6 },
  bolhaEu: { alignSelf: 'flex-end', backgroundColor: T.meGlass, borderColor: 'rgba(201,160,224,0.35)', borderTopRightRadius: 6 },
  envio: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 6 },
  enviar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  trilho: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 6, overflow: 'hidden' },
  pct: { fontFamily: F.titulo, fontSize: 52, color: T.gold, textAlign: 'center', marginTop: 10 },
  signoG: { fontSize: 34, color: T.gold },
  trio: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 14 },
  trioG: { fontSize: 30, color: T.gold, width: 36, textAlign: 'center' },
});
