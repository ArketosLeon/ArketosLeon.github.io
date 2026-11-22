import { useColorScheme } from 'react-native';

// Paleta da marca Arktos Leon (site arketosleon.github.io)
const light = {
  bg: '#f6f5f1', card: '#ffffff', ink: '#0b1a3a', soft: '#38425c', line: '#dcdad2',
  acc: '#b07d12', sup: '#1d4ed8', brown: '#8a5a34', chat: '#efece4', me: '#dbe6ff', them: '#ffffff',
};
const dark = {
  bg: '#0b1a3a', card: '#12254d', ink: '#f3ecdc', soft: '#aab4cc', line: '#223a6b',
  acc: '#e2b23a', sup: '#6f97ff', brown: '#c48a5c', chat: '#0e1f44', me: '#1d3f8a', them: '#16295a',
};
export type Theme = typeof light;
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
