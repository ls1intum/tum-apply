/**
 * Shared theme configuration for component styling across all themes.
 * This file contains the common component overwrites that are used by all theme presets.
 */

export const sharedPrimitiveConfig = {
  borderRadius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    pill: '9999px',
  },
};

export const sharedComponentConfig = {
  button: {
    root: {
      borderRadius: '{border-radius-md}',
      badgeSize: '1rem',
      transitionDuration: '{form.field.transition.duration}',
      paddingX: '0.875rem',
      paddingY: '0.375rem',
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
            background: '{danger.500}',
            color: '{danger.inverseColor}',
            hoverColor: '{danger.inverseColor}',
            hoverBackground: '{danger.hoverColor}',
            activeColor: '{danger.inverseColor}',
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
            hoverBackground: '{danger.100}',
            activeBackground: '{danger.200}',
            color: '{danger.700}',
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
      borderRadius: '{border-radius-pill}',
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
      borderRadius: '{border-radius-xs}',
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
      borderRadius: '{border-radius-md}',
      paddingY: '0.5rem',
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
      paddingY: '0.5rem',
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
  message: {
    root: {
      borderRadius: '{border-radius-sm}',
    },
    colorScheme: {
      light: {
        warn: {
          background: '{warn.100}',
          color: '{warn.500}',
        },
      },
    },
  },
  toggleswitch: {
    root: {
      width: '2rem',
      height: '1rem',
      focusRing: {
        width: '0',
        color: 'transparent',
        offset: '0',
        shadow: 'none',
      },
    },
    handle: {
      size: '0.6rem',
    },
  },
  popover: {
    root: {
      background: '{background.default}',
    },
  },
  menu: {
    root: {
      background: '{background.default}',
    },
  },
};

/**
 * Shared semantic color scheme structure for light mode.
 * This provides the common pattern for how colors map to semantic meanings.
 */
export const sharedLightColorScheme = {
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
    color: '{danger.700}',
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
};
