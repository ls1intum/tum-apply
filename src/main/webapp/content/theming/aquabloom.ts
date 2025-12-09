import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

export const AquaBloomTheme = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#f3faf9',
      100: '#d7f0ed',
      200: '#b0dfdc',
      300: '#80c8c7',
      400: '#55abac',
      500: '#3a8a8c',
      600: '#2e7073',
      700: '#285a5d',
      800: '#24484b',
      900: '#213e40',
      950: '#0e2325',
    },
    secondary: {
      50: '#f0fbfa',
      100: '#d8f4f5',
      200: '#b6eaeb',
      300: '#84d8dc',
      400: '#4abfc6',
      500: '#2d9ea7',
      600: '#298491',
      700: '#276c77',
    },
    success: {
      50: '#f0f9f4',
      100: '#dbf0e2',
      200: '#b9e1ca',
      300: '#8bcaa9',
      400: '#5aad85',
      500: '#3d9e72',
      600: '#277453',
      700: '#1f5d43',
    },
    danger: {
      50: '#fcf4f4',
      100: '#fae6e6',
      200: '#f7d2d1',
      300: '#f0b2b1',
      400: '#e58684',
      500: '#d65b59',
      600: '#c24240',
      700: '#a33432',
    },
    warn: {
      50: '#fbf7ef',
      100: '#f4e8d1',
      200: '#e8cf9f',
      300: '#dcb26d',
      400: '#d49b4b',
      500: '#c87c34',
      600: '#b3612c',
      700: '#954828',
    },
    info: {
      50: '#f3f7fc',
      100: '#e5eff9',
      200: '#c5ddf2',
      300: '#93c2e6',
      400: '#59a3d7',
      500: '#3489c5',
      600: '#246ca5',
      700: '#1e5686',
    },
    neutral: {
      50: '#f5f7f8',
      100: '#e9eef0',
      200: '#d5dde1',
      300: '#bcc7ce',
      400: '#9faeb7',
      500: '#83949e',
      600: '#6d7f89',
      700: '#58666f',
      800: '#47535a',
      900: '#3a454b',
      950: '#242b2f',
    },
    background: {
      50: '#f4f7f7',
      100: '#edf3f3',
      200: '#e1eaea',
    },
    base: {
      white: '#ffffff',
      black: '#000000',
    },
    accent: {
      50: '#fbf9f1',
      100: '#f6f1de',
      200: '#ecdfbc',
      300: '#e0c891',
      400: '#d8b67a',
      500: '#c89447',
      600: '#ba7f3c',
      700: '#9b6533',
    },
    colorScheme: {
      light: {
        text: {
          primary: '{neutral.950}',
          secondary: '{neutral.600}',
          tertiary: '{neutral.500}',
          disabled: '{neutral.600}',
          onPrimary: '{base.white}',
          onSecondary: '{base.white}',
          onAccent: '{base.white}',
          onSuccess: '{neutral.950}',
          onDanger: '{neutral.950}',
          onWarn: '{neutral.950}',
          onInfo: '{neutral.950}',
          onNeutral: '{neutral.950}',
        },
        primary: {
          color: '{primary.400}',
          inverseColor: '{text.onPrimary}',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
          disabledColor: '{primary.200}',
          hoverColorOutlined: '{primary.100}',
        },
        secondary: {
          color: '{secondary.500}',
          inverseColor: '{text.onSecondary}',
          hoverColor: '{secondary.600}',
          activeColor: '{secondary.700}',
          disabledColor: '{secondary.200}',
          hoverColorOutlined: '{secondary.100}',
        },
        accent: {
          color: '{accent.500}',
          inverseColor: '{text.onAccent}',
          hoverColor: '{accent.500}',
          activeColor: '{accent.600}',
          disabledColor: '{accent.200}',
          hoverColorOutlined: '{accent.100}',
        },
        highlight: {
          background: '{primary.950}',
          focusBackground: '{primary.700}',
          color: '{background.default}',
          focusColor: '{background.default}',
        },
        success: {
          color: '{success.500}',
          inverseColor: '{text.onSuccess}',
          hoverColor: '{success.600}',
          activeColor: '{success.700}',
          disabledColor: '{success.200}',
          hoverColorOutlined: '{success.100}',
        },
        warn: {
          color: '{warn.500}',
          inverseColor: '{text.onWarn}',
          hoverColor: '{warn.600}',
          activeColor: '{warn.700}',
          disabledColor: '{warn.200}',
          hoverColorOutlined: '{warn.100}',
        },
        danger: {
          color: '{danger.500}',
          inverseColor: '{text.onDanger}',
          hoverColor: '{danger.600}',
          activeColor: '{danger.700}',
          disabledColor: '{danger.200}',
          hoverColorOutlined: '{danger.100}',
        },
        info: {
          color: '{info.500}',
          inverseColor: '{text.onInfo}',
          hoverColor: '{info.600}',
          activeColor: '{info.700}',
          disabledColor: '{info.200}',
          hoverColorOutlined: '{info.100}',
        },
        neutral: {
          color: '{neutral.500}',
          inverseColor: '{text.onNeutral}',
          hoverColor: '{neutral.600}',
          activeColor: '{neutral.700}',
          disabledColor: '{neutral.200}',
          hoverColorOutlined: '{neutral.200}',
        },
        background: {
          default: '{background.50}', // canvas
          surface: '{background.100}', // cards, panels
          surfaceAlt: '{background.200}', // sidebars etc.
          disabled: '{neutral.200}',
          footer: '{background.50}',
        },
        border: {
          default: '{neutral.200}',
        },
        divider: {
          default: '{neutral.200}',
        },
        card: {
          background: '{background.50}',
          backgroundAlt: '{background.100}',
          backgroundHover: '{background.200}',
          border: '{background.200}',
        },
        informationBlock: {
          background: '{background.50}',
          border: '{primary.color}',
        },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '0.75rem',
        badgeSize: '1rem',
        transitionDuration: '{form.field.transition.duration}',
      },
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '{primary.color}',
              color: '{primary.inverseColor}',
              hoverBackground: '{primary.hoverColor}',
              activeBackground: '{primary.activeColor}',
            },
            secondary: {
              background: '{secondary.color}',
              color: '{secondary.inverseColor}',
              hoverBackground: '{secondary.hoverColor}',
              hoverColor: '{secondary.inverseColor}',
              activeBackground: '{secondary.activeColor}',
            },
            contrast: {
              background: '{accent.color}',
              color: '{accent.inverseColor}',
              hoverBackground: '{accent.hoverColor}',
              hoverColor: '{accent.inverseColor}',
              borderColor: '{accent.color}',
              hoverBorderColor: '{accent.hoverColor}',
              activeBackground: '{accent.activeColor}',
            },
            success: {
              background: '{success.color}',
              color: '{success.inverseColor}',
              hoverBackground: '{success.hoverColor}',
              activeBackground: '{success.activeColor}',
            },
            danger: {
              background: '{danger.color}',
              color: '{danger.inverseColor}',
              hoverColor: '{base.white}',
              hoverBackground: '{danger.hoverColor}',
              activeBackground: '{danger.activeColor}',
            },
            warn: {
              background: '{warn.color}',
              color: '{warn.inverseColor}',
              hoverBackground: '{warn.hoverColor}',
              activeBackground: '{warn.activeColor}',
              borderColor: '{warn.color}',
              hoverBorderColor: '{warn.hoverColor}',
            },
            info: {
              background: '{neutral.color}',
              color: '{neutral.inverseColor}',
              hoverBackground: '{neutral.hoverColor}',
              hoverColor: '{neutral.inverseColor}',
              hoverBorderColor: '{neutral.hoverColor}',
              activeBackground: '{neutral.activeColor}',
              borderColor: '{neutral.color}',
            },
          },
          outlined: {
            primary: {
              activeBackground: '{primary.activeColor}',
              borderColor: '{primary.color}',
              color: '{primary.color}',
              hoverBackground: '{primary.hoverColorOutlined}',
            },
            secondary: {
              activeBackground: '{secondary.activeColor}',
              borderColor: '{secondary.color}',
              color: '{secondary.color}',
              hoverBackground: '{secondary.hoverColorOutlined}',
            },
            success: {
              activeBackground: '{success.activeColor}',
              borderColor: '{success.color}',
              color: '{success.color}',
              hoverBackground: '{success.hoverColorOutlined}',
            },
            info: {
              activeBackground: '{neutral.activeColor}',
              borderColor: '{neutral.color}',
              color: '{neutral.color}',
              hoverBackground: '{neutral.hoverColorOutlined}',
            },
            warn: {
              activeBackground: '{warn.activeColor}',
              borderColor: '{warn.color}',
              color: '{warn.color}',
              hoverBackground: '{warn.hoverColorOutlined}',
            },
            help: {
              hoverBackground: '{purple.50}',
              activeBackground: '{purple.100}',
              borderColor: '{purple.200}',
              color: '{purple.500}',
            },
            danger: {
              activeBackground: '{danger.activeColor}',
              borderColor: '{danger.color}',
              color: '{danger.color}',
              hoverBackground: '{danger.hoverColorOutlined}',
            },
            contrast: {
              hoverBackground: '{surface.50}',
              activeBackground: '{surface.100}',
              borderColor: '{surface.700}',
              color: '{surface.950}',
            },
            plain: {
              hoverBackground: '{surface.50}',
              activeBackground: '{surface.100}',
              borderColor: '{surface.200}',
              color: '{surface.700}',
            },
          },
          text: {
            primary: {
              activeBackground: '{primary.activeColor}',
              color: '{primary.color}',
              hoverBackground: '{primary.hoverColorOutlined}',
            },
            secondary: {
              activeBackground: '{secondary.activeColor}',
              color: '{secondary.color}',
              hoverBackground: '{secondary.hoverColorOutlined}',
            },
            success: {
              activeBackground: '{success.activeColor}',
              color: '{success.color}',
              hoverBackground: '{success.hoverColorOutlined}',
            },
            info: {
              activeBackground: '{neutral.activeColor}',
              color: '{neutral.color}',
              hoverBackground: '{neutral.hoverColorOutlined}',
            },
            warn: {
              activeBackground: '{warn.activeColor}',
              color: '{warn.color}',
              hoverBackground: '{warn.hoverColorOutlined}',
            },
            danger: {
              hoverBackground: '{danger.50}',
              activeBackground: '{danger.100}',
              color: '{danger.500}',
            },
            contrast: {
              hoverBackground: '{surface.50}',
              activeBackground: '{surface.100}',
              color: '{surface.950}',
            },
            plain: {
              hoverBackground: '{surface.50}',
              activeBackground: '{surface.100}',
              color: '{surface.700}',
            },
          },
          link: {
            color: '{primary.color}',
            hoverColor: '{primary.color}',
            activeColor: '{primary.color}',
          },
        },
      },
    },
    stepper: {
      step: {
        padding: '0.5rem',
        gap: '1rem',
      },
      stepHeader: {
        padding: '0',
        gap: '0.5rem',
      },
      separator: {
        size: '0.1rem',
        margin: '0 0 0 1.625rem',
      },
      stepTitle: {
        fontWeight: '700',
      },
      stepNumber: {
        size: '2.25rem',
        fontSize: '1.125rem',
        fontWeight: '700',
        borderRadius: '50%',
        shadow: 'none',
      },
      steppanels: {
        padding: '0.875rem 0.5rem 1.125rem 0.5rem',
      },
      root: {
        transitionDuration: '{transition.duration}',
      },
      colorScheme: {
        light: {
          separator: {
            background: '{text.disabled}',
            activeBackground: '{neutral.950}',
          },
          stepTitle: {
            color: '{text.disabled}',
            activeColor: '{neutral.950}',
          },
          stepNumber: {
            background: '{background.surface}',
            activeBackground: '{primary.color}',
            borderColor: '{background.disabled}',
            activeBorderColor: '{primary.color}',
            color: '{text.disabled}',
            activeColor: '{text.onPrimary}',
          },
        },
      },
    },
    tabs: {
      colorScheme: {
        light: {
          tab: {
            background: '{background.default}',
            activeBackground: '{background.surface}',
            color: '{text.tertiary}',
            activeColor: '{primary.color}',
          },
          tablist: {
            background: '{background.default}',
          },
        },
      },
    },
    floatlabel: {
      root: {
        color: '{text.tertiary}',
        focusColor: '{text.primary}',
        activeColor: '{text.primary}',
        transitionDuration: '0.2s',
        fontWeight: '200',
        active: {
          fontSize: '0.5rem',
          fontWeight: '200',
        },
      },
    },
    tag: {
      root: {
        fontSize: '0.75rem',
        gap: '0',
        borderRadius: '1rem',
      },
      colorScheme: {
        light: {
          secondary: {
            background: '{secondary.100}',
            color: '{base.black}',
          },
          info: {
            background: '{neutral.100}',
            color: '{info.inverseColor}',
          },
          success: {
            background: '{success.100}',
            color: '{success.inverseColor}',
          },
          warn: {
            background: '{warn.100}',
            color: '{warn.inverseColor}',
          },
          danger: {
            background: '{danger.100}',
            color: '{danger.inverseColor}',
          },
          contrast: {
            background: '{accent.100}',
            color: '{base.black}',
          },
        },
      },
    },
    checkbox: {
      root: {
        background: 'background.surface',
        checkedBackground: '{primary.color}',
        checkedHoverBackground: '{primary.hoverColor}',
      },
    },
    paginator: {
      root: {
        background: '{background.default}',
      },
      navButton: {
        selectedBackground: '{primary.color}',
      },
    },
    multiselect: {
      root: {
        background: '{background.surface}',
        color: '{text.primary}',
      },
      overlay: {
        background: '{background.surface}',
      },
      option: {
        color: '{text.primary}',
        selectedColor: '{text.primary}',
        selectedBackground: '{background.surface}',
        focusBackground: '{primary.color}',
        focusColor: '{background.default}',
      },
    },
    inputtext: {
      root: {
        color: '{text.primary}',
        background: '{background.default}',
        borderRadius: '0.5rem',
      },
    },
    divider: {
      content: {
        background: '{background.default}',
        color: '{text.primary}',
      },
    },
    textarea: {
      root: {
        background: '{background.default}',
      },
    },
    select: {
      root: {
        placeholderColor: '{text.tertiary}',
      },
      overlay: {
        background: '{background.default}',
      },
    },
    datepicker: {
      panel: {
        background: '{background.default}',
      },
      header: {
        background: '{background.default}',
      },
    },
    dialog: {
      root: {
        background: '{background.default}',
        color: '{text.primary}',
      },
    },
  },
});
