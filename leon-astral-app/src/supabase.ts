import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { SOL, LUA, ASC, CASAS } from './content';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl: string; supabaseKey: string };
export const SB_URL = extra.supabaseUrl;
const SB_KEY = extra.supabaseKey;

export const sb = createClient(SB_URL, SB_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

WebBrowser.maybeCompleteAuthSession();

// Login Google: abre o navegador do celular e volta pelo esquema leonastral://
export async function entrarComGoogle() {
  const redirectTo = Linking.createURL('auth');
  const { data, error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data?.url) throw error ?? new Error('Sem URL de login');
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return null;
  const url = new URL(res.url);
  const erro = url.searchParams.get('error_description');
  if (erro) throw new Error(erro);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('Login não retornou código');
  const { data: s, error: e2 } = await sb.auth.exchangeCodeForSession(code);
  if (e2) throw e2;
  return s.session;
}

// Chama uma edge function com o token da sessão
export async function chamar<T = any>(fn: string, body: unknown): Promise<T> {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Entre de novo.');
  const r = await fetch(`${SB_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`);
  return j as T;
}

// Atualiza os textos com a biblioteca do banco (se falhar, usa os do app)
export async function carregarBiblioteca() {
  const { data, error } = await sb.from('biblioteca').select('tipo,indice,texto,extra');
  if (error || !data) return;
  for (const r of data as any[]) {
    if (r.tipo === 'sol') SOL[r.indice] = r.texto;
    if (r.tipo === 'lua') LUA[r.indice] = r.texto;
    if (r.tipo === 'asc' && r.extra?.adjetivos) ASC[r.indice] = r.extra.adjetivos;
    if (r.tipo === 'casa_transito') CASAS[r.indice] = { t: CASAS[r.indice].t, f: r.texto, c: r.extra.cuidado, p: r.extra.pergunta };
  }
}
