// Notificação diária: pede permissão, pega o token Expo e guarda no Supabase.
// O envio acontece no servidor (edge function horoscopo-diario, todo dia às 7h).
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { sb } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function registrarPush(uid: string): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('diario', {
        name: 'Horóscopo do dia',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#A78BFA',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return false;
    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await sb.from('push_tokens').upsert({ token, user_id: uid, plataforma: Platform.OS, ativo: true, atualizado_em: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

export async function removerPush(uid: string) {
  try { await sb.from('push_tokens').delete().eq('user_id', uid); } catch {}
}
