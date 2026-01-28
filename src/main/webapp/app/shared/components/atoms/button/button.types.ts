import { ButtonColor, ButtonVariant } from './button.component';

export interface ActionButton {
  label: string;
  severity?: ButtonColor;
  variant?: ButtonVariant;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  shouldTranslate?: boolean;
}
