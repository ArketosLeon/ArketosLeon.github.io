import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch,
  Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { sb, entrarCom, carregarBiblioteca } from './src/supabase';
import { useTheme, Theme } from './src/theme';
import { calcular, dJ, fase, lua, sg, Mapa, Perfil } from './src/astro';
import { ASC, CASAS, CIDADES, ELEMENTOS, GLIFOS, LUA, SIGNOS, SOL } from './src/content';
import { respostaEstela, Dia } from './src/estela';
import Wheel from './src/Wheel';

type Aba = 'hoje' | 'mapa' | 'conversa';
type Msg = { id: string; de: 'eu' | 'estela'; texto: string; hora: string };

const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const t = useTheme();
  const s = useMemo(() => estilos(t), [t]);
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [aba, setAba] = useState<Aba>('hoje');

  useEffect(() => {
    carregarBiblioteca().catch(() => {});
    sb.auth.getSession().then(({ data }) => setSessao(data.session)).finally(() => setCarregando(false));
    const { data: sub } = sb.auth.onAuthStateChange((_e, sess) => setSessao(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao) { setPerfil(null); return; }
    setCarregando(true);
    sb.from('perfis').select('*').eq('id', sessao.user.id).maybeSingle().then(({ data: p }) => {
      if (p) {
        const ci = Math.max(0, CIDADES.findIndex((c) => c[0] === p.cidade));
        setPerfil({ nome: p.nome, data: p.data_nasc, hora: p.hora_nasc ? p.hora_nasc.slice(0, 5) : '', cidade: ci, whatsapp: p.whatsapp ?? '' });
      } else setPerfil(null);
      setCarregando(false);
    });
  }, [sessao]);

  const mapa: Mapa | null = useMemo(() => (perfil ? calcular(perfil, CIDADES) : null), [perfil]);
  const dia: Dia | null = useMemo(() => {
    if (!mapa) return null;
    const tm = sg(lua(dJ(Date.now()))), s0 = sg(mapa.sun);
    return { s: s0, m: sg(mapa.moon), a: mapa.asc != null ? sg(mapa.asc) : null, tm, ca: (tm - s0 + 12) % 12 };
  }, [mapa]);

  if (carregando) return <View style={[s.fill, s.center]}><ActivityIndicator color={t.sup} size="large" /></View>;

  return (
    <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <View style={s.brand}>
        <Image source={require('./assets/emblema.png')} style={{ width: 46, height: 25 }} resizeMode="contain" accessibilityLabel="Emblema Arktos Leon" />
        <View>
          <Text style={s.brandTitle}>LEON ASTRAL</Text>
          <Text style={s.small}>por Arktos Leon</Text>
        </View>
        <Text style={s.kanji}>熊<Text style={{ color: t.acc }}>獅</Text></Text>
      </View>
      {!sessao ? (
        <Login t={t} s={s} />
      ) : !perfil || editando ? (
        <Cadastro t={t} s={s} sessao={sessao} inicial={perfil} onSalvo={(p) => { setPerfil(p); setEditando(false); setAba('hoje'); }} />
      ) : (
        <>
          <View style={s.fill}>
            {aba === 'hoje' && dia && <Hoje s={s} perfil={perfil} dia={dia} />}
            {aba === 'mapa' && mapa && dia && <MeuMapa t={t} s={s} perfil={perfil} mapa={mapa} dia={dia} onEditar={() => setEditando(true)} />}
            {aba === 'conversa' && dia && <Conversa t={t} s={s} perfil={perfil} dia={dia} uid={sessao.user.id} />}
          </View>
          <View style={s.tabs} accessibilityRole="tablist">
            {([['hoje', '☼', 'Hoje'], ['mapa', '◎', 'Meu mapa'], ['conversa', '✉', 'Conversa']] as const).map(([k, g, l]) => (
              <Pressable key={k} style={s.tab} onPress={() => setAba(k)} accessibilityRole="tab" accessibilityState={{ selected: aba === k }}>
                <Text style={[s.tabG, aba === k && { color: t.acc }]}>{g}</Text>
                <Text style={[s.tabL, aba === k && { color: t.acc }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

type S = ReturnType<typeof estilos>;

function Login({ t, s }: { t: Theme; s: S }) {
  const { width } = useWindowDimensions();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const entrar = async (p: 'google' | 'facebook') => {
    setErro(''); setOcupado(p);
    try { await entrarCom(p); } catch (e: any) {
      setErro(/not enabled|provider/i.test(e?.message ?? '') ? `O login com ${p === 'google' ? 'Google' : 'Facebook'} ainda está sendo configurado.` : `Não deu para entrar: ${e?.message ?? 'erro'}`);
    } finally { setOcupado(null); }
  };
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <View style={s.center}><Wheel size={Math.min(width - 40, 300)} t={t} /></View>
      <Text style={s.h1}>Leon Astral</Text>
      <Text style={[s.muted, { marginBottom: 18 }]}>Seu horóscopo feito com o seu mapa astral, não só com o seu signo. E a Estela, sua astróloga de bolso, para conversar.</Text>
      <Pressable style={s.btn} onPress={() => entrar('google')} disabled={!!ocupado} accessibilityRole="button">
        <Text style={[s.btnIcon, { color: '#4285F4' }]}>G</Text><Text style={s.btnTxt}>Continuar com Google</Text>
        {ocupado === 'google' && <ActivityIndicator color={t.sup} style={{ marginLeft: 'auto' }} />}
      </Pressable>
      <Pressable style={s.btn} onPress={() => entrar('facebook')} disabled={!!ocupado} accessibilityRole="button">
        <Text style={[s.btnIcon, { color: '#1877F2' }]}>f</Text><Text style={s.btnTxt}>Continuar com Facebook</Text>
        {ocupado === 'facebook' && <ActivityIndicator color={t.sup} style={{ marginLeft: 'auto' }} />}
      </Pressable>
      {!!erro && <Text style={[s.muted, { color: t.acc, fontWeight: '700' }]} accessibilityRole="alert">{erro}</Text>}
      <Text style={[s.muted, { marginTop: 14 }]}>Entre com a conta que você já usa. Não precisa criar senha nova.</Text>
      <Text style={[s.small, { textAlign: 'center', marginTop: 24 }]}>Leon Astral · um produto Arktos Leon</Text>
    </ScrollView>
  );
}

// "1990-06-15" <-> "15/06/1990"
const isoParaBr = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');
const brParaIso = (br: string) => { const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const mascaraData = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
const mascaraHora = (v: string) => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2');

function Cadastro({ t, s, sessao, inicial, onSalvo }: { t: Theme; s: S; sessao: Session; inicial: Perfil | null; onSalvo: (p: Perfil) => void }) {
  const meta: any = sessao.user.user_metadata ?? {};
  const [nome, setNome] = useState(inicial?.nome ?? String(meta.full_name ?? meta.name ?? '').split(' ')[0]);
  const [data, setData] = useState(isoParaBr(inicial?.data ?? ''));
  const [hr, setHr] = useState(inicial?.hora ?? '');
  const [cidade, setCidade] = useState(inicial?.cidade ?? 0);
  const [wa, setWa] = useState(inicial?.whatsapp ?? '');
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
    const p: Perfil = { nome: nome.trim(), data: iso, hora: hr, cidade, whatsapp: wa };
    const c = CIDADES[cidade], m = calcular(p, CIDADES), uid = sessao.user.id;
    const r1 = await sb.from('perfis').upsert({ id: uid, nome: p.nome, data_nasc: iso, hora_nasc: hr || null, cidade: c[0], lat: c[1], lon: c[2], tz_offset: c[3], whatsapp: wa || null, consentimento_lgpd: true, consentimento_em: new Date().toISOString() });
    const r2 = r1.error ? r1 : await sb.from('mapas').upsert({ user_id: uid, sol_lon: m.sun, lua_lon: m.moon, asc_lon: m.asc, sol_signo: sg(m.sun), lua_signo: sg(m.moon), asc_signo: m.asc == null ? null : sg(m.asc), calculado_em: new Date().toISOString() });
    setSalvando(false);
    if (r2.error) return setErro('Não consegui salvar: ' + r2.error.message);
    onSalvo(p);
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <Text style={s.h2}>Quando você nasceu?</Text>
        <Text style={[s.muted, { marginBottom: 16 }]}>Com data, hora e cidade eu calculo seu Sol, sua Lua e seu Ascendente.</Text>
        <Text style={s.label}>Como posso te chamar?</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor={t.soft} autoComplete="given-name" />
        <Text style={s.label}>Data de nascimento</Text>
        <TextInput style={s.input} value={data} onChangeText={(v) => setData(mascaraData(v))} placeholder="DD/MM/AAAA" placeholderTextColor={t.soft} keyboardType="number-pad" />
        <Text style={s.label}>Hora de nascimento <Text style={s.small}>(se não souber, deixe em branco)</Text></Text>
        <TextInput style={s.input} value={hr} onChangeText={(v) => setHr(mascaraHora(v))} placeholder="HH:MM" placeholderTextColor={t.soft} keyboardType="number-pad" />
        <Text style={s.label}>Cidade de nascimento</Text>
        <View style={s.chips}>
          {CIDADES.map((c, i) => (
            <Pressable key={c[0]} onPress={() => setCidade(i)} style={[s.chip, cidade === i && { backgroundColor: t.sup, borderColor: t.sup }]} accessibilityRole="radio" accessibilityState={{ checked: cidade === i }}>
              <Text style={[s.chipTxt, cidade === i && { color: '#fff' }]}>{c[0]}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>WhatsApp (opcional)</Text>
        <TextInput style={s.input} value={wa} onChangeText={setWa} placeholder="(11) 99999-9999" placeholderTextColor={t.soft} keyboardType="phone-pad" />
        <View style={[s.row, { marginTop: 14 }]}>
          <Switch value={ok} onValueChange={setOk} trackColor={{ true: t.sup }} accessibilityLabel="Aceito o uso dos meus dados" />
          <Text style={[s.body, { flex: 1 }]}>Aceito o uso dos meus dados de nascimento para gerar meu horóscopo (LGPD).</Text>
        </View>
        {!!erro && <Text style={[s.muted, { color: t.acc, fontWeight: '700', marginTop: 8 }]} accessibilityRole="alert">{erro}</Text>}
        <Pressable style={[s.btn, s.btnMain]} onPress={salvar} disabled={salvando} accessibilityRole="button">
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnTxt, { color: '#fff' }]}>Ver meu céu</Text>}
        </Pressable>
        <Text style={[s.small, { marginTop: 14 }]}>Conteúdo de entretenimento e autoconhecimento. Não substitui ajuda médica ou psicológica.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Hoje({ s, perfil, dia }: { s: S; perfil: Perfil; dia: Dia }) {
  const H = CASAS[dia.ca], mesmo = dia.tm % 4 === dia.s % 4;
  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.k}>{data}</Text>
      <Text style={s.h2}>Bom dia, {perfil.nome}. Hoje: {H.t.toLowerCase()}.</Text>
      <View style={s.card}>
        <Text style={s.body}>A Lua está em <Text style={{ fontWeight: '700' }}>{SIGNOS[dia.tm]}</Text> ({fase(dJ(Date.now()))}) e passa pela sua casa {dia.ca + 1}, a casa de {H.t.toLowerCase()}. {mesmo ? 'É o mesmo elemento do seu Sol, então o dia tende a fluir com você.' : 'É um elemento diferente do seu Sol, então vale ir com mais calma.'}</Text>
        <Item s={s} g="✦" k="Foco do dia" v={H.f} />
        <Item s={s} g="⚠" k="Cuidado com" v={H.c} />
        <Item s={s} g="?" k="Pergunta para você" v={H.p} />
      </View>
    </ScrollView>
  );
}

function Item({ s, g, k, v }: { s: S; g: string; k: string; v: string }) {
  return (
    <View style={s.item}>
      <Text style={s.itemG}>{g}</Text>
      <View style={{ flex: 1 }}><Text style={s.k}>{k}</Text><Text style={s.body}>{v}</Text></View>
    </View>
  );
}

function MeuMapa({ t, s, perfil, mapa, dia, onEditar }: { t: Theme; s: S; perfil: Perfil; mapa: Mapa; dia: Dia; onEditar: () => void }) {
  const { width } = useWindowDimensions();
  const big = [['Sol', dia.s, 'quem você é'], ['Lua', dia.m, 'o que você sente'], ['Ascendente', dia.a, 'como te veem']] as const;
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>O céu de {perfil.nome}</Text>
      <View style={[s.center, { marginVertical: 8 }]}>
        <Wheel size={Math.min(width - 40, 320)} t={t} sun={mapa.sun} moon={mapa.moon} asc={mapa.asc} today={lua(dJ(Date.now()))} />
      </View>
      <View style={s.big3}>
        {big.map(([k, i, x]) => (
          <View key={k} style={s.b}>
            <Text style={s.small}>{k}</Text>
            <Text style={s.bG}>{i == null ? '?' : GLIFOS[i]}</Text>
            <Text style={s.bS}>{i == null ? 'sem hora' : SIGNOS[i]}</Text>
            <Text style={s.small}>{x}</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Item s={s} g="☉" k={`Sol em ${SIGNOS[dia.s]} · ${ELEMENTOS[dia.s % 4]}`} v={SOL[dia.s]} />
        <Item s={s} g="☽" k={`Lua em ${SIGNOS[dia.m]}`} v={LUA[dia.m]} />
        <Item s={s} g="↑" k={`Ascendente${dia.a != null ? ' em ' + SIGNOS[dia.a] : ''}`} v={dia.a != null ? `As pessoas te percebem como alguém ${ASC[dia.a]}.` : 'Para calcular o Ascendente eu preciso da hora em que você nasceu.'} />
      </View>
      <Text style={s.small}>Linha tracejada: a Lua de hoje, em {SIGNOS[dia.tm]}. Cálculo simplificado nesta versão beta.</Text>
      <Pressable style={[s.btn, { justifyContent: 'center', marginTop: 16 }]} onPress={onEditar}><Text style={s.btnTxt}>Editar meus dados</Text></Pressable>
      <Pressable style={[s.btn, { justifyContent: 'center' }]} onPress={() => sb.auth.signOut()}><Text style={s.btnTxt}>Sair</Text></Pressable>
    </ScrollView>
  );
}

function Conversa({ t, s, perfil, dia, uid }: { t: Theme; s: S; perfil: Perfil; dia: Dia; uid: string }) {
  const H = CASAS[dia.ca];
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 'a', de: 'estela', hora: hora(), texto: `Oi, ${perfil.nome}! Eu sou a Estela, do Leon Astral ✧\nLi o seu céu: Sol em ${SIGNOS[dia.s]}, Lua em ${SIGNOS[dia.m]}${dia.a != null ? ' e Ascendente em ' + SIGNOS[dia.a] : ''}.` },
    { id: 'b', de: 'estela', hora: hora(), texto: `Hoje a Lua está em ${SIGNOS[dia.tm]} e o tema do seu dia é ${H.t.toLowerCase()}. ${H.f}\n\nMe conta: como você está?` },
  ]);
  const [txt, setTxt] = useState('');
  const [digitando, setDigitando] = useState(false);
  const lista = useRef<any>(null);

  const enviar = (texto: string) => {
    const v = texto.trim(); if (!v) return;
    setMsgs((m) => [...m, { id: String(Date.now()), de: 'eu', texto: v, hora: hora() }]);
    setTxt('');
    sb.from('mensagens').insert({ user_id: uid, origem: 'usuario', canal: 'app', texto: v.slice(0, 2000) }).then(() => {});
    setDigitando(true);
    setTimeout(() => {
      setDigitando(false);
      setMsgs((m) => [...m, { id: String(Date.now() + 1), de: 'estela', texto: respostaEstela(v, perfil.nome, dia), hora: hora() }]);
    }, 900 + Math.random() * 600);
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
      <View style={s.chead}>
        <View style={s.av}><Text style={{ color: '#fff', fontSize: 20 }}>✧</Text></View>
        <View><Text style={s.bS}>Estela</Text><Text style={s.small}>{digitando ? 'digitando…' : 'online'}</Text></View>
      </View>
      <ScrollView ref={lista} style={{ flex: 1, backgroundColor: t.chat }} contentContainerStyle={{ padding: 14, gap: 8 }} onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}>
        {msgs.map((m) => (
          <View key={m.id} style={[s.msg, m.de === 'eu' ? s.msgEu : s.msgEla]}>
            <Text style={s.body}>{m.texto}</Text>
            <Text style={[s.small, { textAlign: 'right' }]}>{m.hora}</Text>
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal style={{ backgroundColor: t.chat, flexGrow: 0 }} contentContainerStyle={{ gap: 8, padding: 8 }} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {['Como está meu dia?', 'E no amor?', 'Trabalho e dinheiro', 'O que é meu ascendente?', 'Me ajuda a refletir'].map((c) => (
          <Pressable key={c} style={s.chip} onPress={() => enviar(c)}><Text style={s.chipTxt}>{c}</Text></Pressable>
        ))}
      </ScrollView>
      <View style={s.send}>
        <TextInput style={[s.input, { flex: 1, marginTop: 0 }]} value={txt} onChangeText={setTxt} placeholder="Escreva para a Estela" placeholderTextColor={t.soft} onSubmitEditing={() => enviar(txt)} returnKeyType="send" />
        <Pressable style={s.sendBtn} onPress={() => enviar(txt)} accessibilityLabel="Enviar"><Text style={{ color: '#fff', fontSize: 18 }}>➤</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function estilos(t: Theme) {
  return StyleSheet.create({
    fill: { flex: 1, backgroundColor: t.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    pad: { padding: 20, paddingBottom: 32 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.card, borderBottomWidth: 1, borderColor: t.line },
    brandTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: t.ink },
    kanji: { marginLeft: 'auto', fontSize: 20, color: t.brown },
    h1: { fontSize: 38, fontWeight: '800', color: t.ink, marginTop: 8 },
    h2: { fontSize: 25, fontWeight: '800', color: t.ink, lineHeight: 30, marginBottom: 4 },
    body: { fontSize: 16, lineHeight: 23, color: t.ink },
    muted: { fontSize: 15, lineHeight: 21, color: t.soft },
    small: { fontSize: 13, color: t.soft },
    k: { fontSize: 13, fontWeight: '700', color: t.soft, textTransform: 'capitalize' },
    label: { fontSize: 14, fontWeight: '700', color: t.ink, marginTop: 12 },
    input: { minHeight: 48, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingHorizontal: 12, fontSize: 16, color: t.ink, backgroundColor: t.card, marginTop: 6 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, marginTop: 10 },
    btnMain: { backgroundColor: t.sup, borderColor: t.sup, justifyContent: 'center', marginTop: 18 },
    btnIcon: { fontSize: 20, fontWeight: '800', width: 22, textAlign: 'center' },
    btnTxt: { fontSize: 16, fontWeight: '700', color: t.ink },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: t.line, backgroundColor: t.card },
    chipTxt: { fontSize: 14, fontWeight: '600', color: t.ink },
    card: { backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 18, padding: 16, marginVertical: 12 },
    item: { flexDirection: 'row', gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderColor: t.line },
    itemG: { fontSize: 20, color: t.sup, width: 26, textAlign: 'center' },
    big3: { flexDirection: 'row', gap: 8 },
    b: { flex: 1, alignItems: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 10 },
    bG: { fontSize: 26, color: t.acc },
    bS: { fontSize: 15, fontWeight: '700', color: t.ink },
    tabs: { flexDirection: 'row', backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line },
    tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
    tabG: { fontSize: 20, color: t.soft },
    tabL: { fontSize: 12, fontWeight: '700', color: t.soft },
    chead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 16, backgroundColor: t.card, borderBottomWidth: 1, borderColor: t.line },
    av: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center' },
    msg: { maxWidth: '84%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14 },
    msgEu: { alignSelf: 'flex-end', backgroundColor: t.me, borderTopRightRadius: 4 },
    msgEla: { alignSelf: 'flex-start', backgroundColor: t.them, borderTopLeftRadius: 4 },
    send: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line },
    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.sup, alignItems: 'center', justifyContent: 'center' },
  });
}
