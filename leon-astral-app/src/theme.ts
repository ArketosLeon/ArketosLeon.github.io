// Leon Astral — design v12: céu de meia-noite, vidro fosco, dourado → roxo
export const T = {
  bg: '#0B0E17',
  ink: '#F4EEF8',
  soft: '#B7B2C8',
  lav: '#A78BFA',
  blush: '#E2B4BD',
  gold: '#F3C68F',
  glass: 'rgba(255,255,255,0.04)',
  edge: 'rgba(255,255,255,0.10)',
  lavGlass: 'rgba(167,139,250,0.14)',
  meGlass: 'rgba(201,160,224,0.20)',
  danger: '#F2A7B3',
};
// degradê padrão (regra de cor do Carlos): dourado → roxo
export const GRAD = ['#FBE3BB', '#F3C68F', '#C9A0E0', '#A78BFA'] as const;
export const F = {
  titulo: 'Cinzel_600SemiBold',
  texto: 'PlusJakartaSans_400Regular',
  medio: 'PlusJakartaSans_500Medium',
  forte: 'PlusJakartaSans_700Bold',
};
export type Theme = typeof T;
