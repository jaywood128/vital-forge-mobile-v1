/**
 * VitalForge color palette – matches Rails design system.
 * See: vital-forge-v1/documentation/STYLING_UPDATE.md
 *      vital-forge-v1/.cursor/rules/frontend/frontend-rules.mdc
 */
export const colors = {
  // Primary
  electricBlue: '#2563EB',
  energeticOrange: '#F97316',

  // Secondary
  deepNavy: '#1E293B',
  freshGreen: '#10B981',
  warmGray: '#F1F5F9',

  // Accent
  brightRed: '#EF4444',
  lightBlue: '#DBEAFE',

  // Neutral
  pureWhite: '#FFFFFF',
  mediumGray: '#64748B',
  darkCharcoal: '#0F172A',

  // Optional dark/light shades from docs
  electricBlueDark: '#1D4ED8',
  energeticOrangeDark: '#EA580C',
  deepNavyLight: '#334155',
  warmGray2: '#E2E8F0',

  // Semantic
  success: '#10B981',
  lightGreen: '#D1FAE5',
} as const;

export type ColorKey = keyof typeof colors;
