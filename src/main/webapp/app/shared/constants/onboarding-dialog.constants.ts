/**
 * Shared configuration constants for onboarding dialogs.
 */
export const ONBOARDING_FORM_DIALOG_CONFIG = {
  modal: true,
  closable: true,
  dismissableMask: false,
  width: '56.25rem',
  style: {
    'max-width': '95vw',
    'background-color': 'white',
    'border-radius': '0.5rem',
  },
  focusOnShow: false,
} as const;
