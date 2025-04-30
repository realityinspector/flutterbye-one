import { extendTheme } from 'native-base';

export const theme = extendTheme({
  colors: {
    primary: {
      50: '#e6f2ff',
      100: '#cce0ff',
      200: '#99c2ff',
      300: '#66a3ff',
      400: '#3385ff',
      500: '#0066ff', // Main primary color
      600: '#0052cc',
      700: '#003d99',
      800: '#002966',
      900: '#001433',
    },
    secondary: {
      50: '#fff5e6',
      100: '#ffeacc',
      200: '#ffd699',
      300: '#ffc266',
      400: '#ffad33',
      500: '#ff9900', // Main secondary color
      600: '#cc7a00',
      700: '#995c00',
      800: '#663d00',
      900: '#331f00',
    },
  },
  fontConfig: {
    Roboto: {
      300: {
        normal: 'Roboto-Light',
      },
      400: {
        normal: 'Roboto-Regular',
      },
      500: {
        normal: 'Roboto-Medium',
      },
      700: {
        normal: 'Roboto-Bold',
      },
    },
  },
  fonts: {
    heading: 'Roboto',
    body: 'Roboto',
    mono: 'Roboto',
  },
  config: {
    initialColorMode: 'light',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Input: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});
