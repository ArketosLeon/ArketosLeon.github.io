import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { SOL, LUA, ASC, CASAS } from './content';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl: string; supabaseKey: string };

export const sb = createClient(extra.supabaseUrl, extra.supabaseKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

WebBrowser.maybeCompleteAuthSession();

// Login Google/Facebook: abre o navegador do celular e volta pelo esquema leonastral://
export async function entrarCom(provider: 'google' | 'facebook') {
  const redirectTo = Linking.createURL('auth');
  const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
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
