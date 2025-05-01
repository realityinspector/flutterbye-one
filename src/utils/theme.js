import { extendTheme } from 'native-base';

// Simplified 4-color palette
export const theme = extendTheme({
  colors: {
    // Core palette with 4 main colors
    primary: {
      50: '#e6f0ff',
      100: '#cce0ff',
      200: '#99c2ff',
      300: '#66a3ff',
      400: '#3385ff',
      500: '#0066ff', // Primary action color
      600: '#0052cc', // Pressed state
      700: '#003d99',
      800: '#002966',
      900: '#001433',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f0f4f8', // Light background
      200: '#e2eaf2',
      300: '#d4e0ec',
      400: '#c6d6e6',
      500: '#e2e8f0', // Borders, dividers
      600: '#b8cce0',
      700: '#aac2da',
      800: '#9cb8d4',
      900: '#8eaece',
    },
    text: {
      50: '#f7f7f7',
      100: '#e6e6e6',
      200: '#cdcdcd',
      300: '#b4b4b4',
      400: '#9b9b9b',
      500: '#1a202c', // Main text
      600: '#695e5e',
      700: '#4a5568', // Secondary text
      800: '#322828',
      900: '#191414',
    },
    // Status colors with all necessary shades
    success: {
      50: '#e8f7ee',
      100: '#d1f0dd',
      200: '#a3e0bb',
      300: '#75d199',
      400: '#48bb78', // Success states
      500: '#48bb78',
      600: '#3a9660',
      700: '#2b7048',
      800: '#1d4b30',
      900: '#0e2518',
    },
    error: {
      50: '#fce8e8',
      100: '#f9d1d1',
      200: '#f4a3a3',
      300: '#ef7575',
      400: '#ea4747',
      500: '#e53e3e', // Error states
      600: '#b73232',
      700: '#892525',
      800: '#5c1919',
      900: '#2e0c0c',
    },
    warning: {
      50: '#fef5eb',
      100: '#fdead6',
      200: '#fbd5ad',
      300: '#f9c185',
      400: '#f7ac5c',
      500: '#f6ad55', // Warning states
      600: '#c58a44',
      700: '#946833',
      800: '#624522',
      900: '#312311',
    },
    info: {
      50: '#e8f4fc',
      100: '#d1e9f9',
      200: '#a3d3f2',
      300: '#75beec',
      400: '#47a8e5',
      500: '#4299e1', // Info states
      600: '#357ab4',
      700: '#285c87',
      800: '#1a3d5a',
      900: '#0d1f2d',
    },
    // Alias for backward compatibility
    danger: {
      50: '#fce8e8',
      100: '#f9d1d1',
      200: '#f4a3a3',
      300: '#ef7575',
      400: '#ea4747',
      500: '#e53e3e', // Error states - same as error
      600: '#b73232',
      700: '#892525',
      800: '#5c1919',
      900: '#2e0c0c',
    },
  },
  // Keep only essential config
  config: {
    initialColorMode: 'light',
  },
});
