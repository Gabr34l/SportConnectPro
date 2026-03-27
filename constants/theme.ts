import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary:       '#00C853',
    primaryDark:   '#00952A',
    primaryLight:  '#69F0AE',
    primaryMuted:  '#E8F5E9',
    accent:        '#FF6D00',
    danger:        '#D32F2F',
    background:    '#F9FAFB',
    surface:       '#FFFFFF',
    border:        '#E0E0E0',
    textPrimary:   '#1A1A1A',
    textSecondary: '#616161',
    textMuted:     '#9E9E9E',
    textInverse:   '#FFFFFF',
  },
  shadow: {
    card: { 
      elevation: 3,
      ...Platform.select({
        web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any,
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }
      })
    },
    button: { 
      elevation: 6,
      ...Platform.select({
        web: { boxShadow: '0px 4px 8px rgba(0,200,83,0.3)' } as any,
        default: { shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
      })
    },
  },
};

export function corVagas(vagas: number, limite: number): string {
  const pct = vagas / limite;
  if (pct <= 0)   return '#D32F2F';
  if (pct <= 0.3) return '#FF6D00';
  return '#00C853';
}
