/**
 * Shared configuration constants for onboarding dialogs.
 */
export const ONBOARDING_FORM_DIALOG_CONFIG = {
  modal: true,
  closable: true,
  draggable: false,
  dismissableMask: false,
  width: '56.25rem',
  style: {
    'max-width': '95vw',
    'background-color': 'var(--p-background-default)',
    'border-radius': '0.5rem',
  },
  focusOnShow: false,
} as const;
