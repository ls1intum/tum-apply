import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';

export const TUMApplyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{blue.500}',
          inverseColor: '#ffffff',
          hoverColor: '{blue.900}',
          activeColor: '{blue.800}',
        },
        highlight: {
          background: '{blue.950}',
          focusBackground: '{blue.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{blue.50}',
          inverseColor: '{blue.950}',
          hoverColor: '{blue.100}',
          activeColor: '{blue.200}',
        },
        highlight: {
          background: '#fafafa',
          focusBackground: '#fafafa',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
    },
  },
});
