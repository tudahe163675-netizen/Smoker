/**
 * Colors mapping từ variables.css
 * Sử dụng RGB values để tương thích với React Native
 */

export const Colors = {
  // Base Colors
  background: 'rgb(240, 242, 245)',
  foreground: 'rgb(15, 23, 42)',
  
  // Surface Colors
  card: 'rgb(255, 255, 255)',
  cardForeground: 'rgb(15, 23, 42)',
  muted: 'rgb(248, 250, 252)',
  mutedForeground: 'rgb(100, 116, 139)',
  border: 'rgb(226, 232, 240)',
  borderDarker: 'rgb(51, 65, 85)',
  
  // Brand / Action Colors
  primary: 'rgb(34, 211, 238)', // Neon Cyan
  primaryForeground: 'rgb(255, 255, 255)',
  secondary: 'rgb(236, 72, 153)', // Neon Pink
  secondaryForeground: 'rgb(255, 255, 255)',
  
  // Feedback Colors
  success: 'rgb(34, 211, 238)', // Cyan
  warning: 'rgb(251, 191, 36)', // Yellow
  danger: 'rgb(239, 68, 68)', // Red
  
  // UI Support Colors
  input: 'rgb(248, 250, 252)',
  inputBorder: 'rgb(226, 232, 240)',
  overlay: 'rgba(0, 0, 0, 0.45)',
  
  // Extra Semantic Tokens
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  accent: 'rgb(34, 211, 238)',
  highlight: 'rgb(236, 72, 153)',
  primaryHover: 'rgb(6, 182, 212)',
  primaryLight: 'rgb(207, 250, 254)',
  cardHover: 'rgb(240, 253, 250)',
  
  // Dark Mode Colors (có thể dùng cho theme switching sau)
  dark: {
    background: 'rgb(9, 9, 11)',
    foreground: 'rgb(250, 250, 250)',
    card: 'rgb(24, 24, 27)',
    cardForeground: 'rgb(250, 250, 250)',
    muted: 'rgb(39, 39, 42)',
    mutedForeground: 'rgb(161, 161, 170)',
    border: 'rgb(63, 63, 70)',
    primary: 'rgb(255, 255, 255)',
    primaryForeground: 'rgb(9, 9, 11)',
  },
};

// Helper function để format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Helper function để format số tiền không có đơn vị
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

