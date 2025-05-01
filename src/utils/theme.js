import { extendTheme } from 'native-base';

// Ultra-simplified 4-color palette with minimal shades
export const theme = extendTheme({
  colors: {
    // Four essential colors
    primary: {
      50: '#e6f0ff', // Lightest background
      100: '#cce0ff', // Light background
      500: '#0066ff', // Primary action color
      600: '#0052cc', // Pressed state
      800: '#002966', // Dark accent
    },
    gray: {
      50: '#f8fafc',  // Background light
      100: '#f0f4f8', // Card/section background
      200: '#e2e8f0', // Borders, dividers
      400: '#a0aec0', // Disabled text
      500: '#718096', // Secondary text
      900: '#1a202c', // Primary text
    },
    green: {
      100: '#d1f0dd',
      500: '#48bb78', // Success
    },
    red: {
      100: '#f9d1d1',
      500: '#e53e3e', // Error/Danger
    },
    // Additional functional colors (minimal shades)
    amber: {
      100: '#fdead6',
      500: '#f6ad55', // Warning
    },
    blue: {
      100: '#d1e9f9',
      500: '#4299e1', // Info
    },
  },
  config: {
    initialColorMode: 'light',
  },
});
