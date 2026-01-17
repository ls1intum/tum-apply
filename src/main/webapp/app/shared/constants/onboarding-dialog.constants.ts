/**
 * Shared configuration constants for onboarding dialogs.
 */
export const ONBOARDING_FORM_DIALOG_CONFIG = {
  modal: true,
  closable: true,
  draggable: false,
  dismissableMask: true,
  width: '56.25rem',
  style: {
    'max-width': '95vw',
    'background-color': 'var(--p-background-default)',
    'border-radius': 'var(--border-radius-xl)',
  },
  focusOnShow: false,
} as const;
