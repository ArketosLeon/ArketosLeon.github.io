// Erros (Sentry) e uso anônimo (PostHog). Nada de nome, data de nascimento ou texto da conversa é enviado.
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

export const SENTRY_DSN = 'https://cbd65f4881ce0a4f74c999e8ad682226@o4512478470471680.ingest.us.sentry.io/4512478519427072';
const POSTHOG_KEY = 'phc_vuSKtVf7AQkKepCsLUUDxLZcQjYrU3abpFGJ3SyYDDwy';

Sentry.init({ dsn: SENTRY_DSN, sendDefaultPii: false, tracesSampleRate: 0.2, enabled: !__DEV__ });

export const posthog = new PostHog(POSTHOG_KEY, { host: 'https://us.i.posthog.com', captureAppLifecycleEvents: true, personProfiles: 'identified_only' });

export const evento = (nome: string, props?: Record<string, string | number | boolean>) => {
  try { posthog.capture(nome, props); } catch {}
};
export const identificar = (uid: string) => { try { posthog.identify(uid); Sentry.setUser({ id: uid }); } catch {} };
export const sair = () => { try { posthog.reset(); Sentry.setUser(null); } catch {} };
export { Sentry };
