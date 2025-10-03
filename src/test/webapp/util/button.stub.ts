import { Component, input } from '@angular/core';

@Component({
  selector: 'jhi-button',
  standalone: true,
  template: '',
})
export class ButtonStubComponent {
  icon = input<string>();
  severity = input<string>();
  label = input<string>();
  disabled = input<boolean>();
  type = input<string>();
  size = input<string>();
}
