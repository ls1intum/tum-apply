import { Component, Input } from '@angular/core';

@Component({
  selector: 'jhi-button',
  standalone: true,
  template: '',
})
export class ButtonStubComponent {
  @Input() icon?: string;
  @Input() severity?: string;
  @Input() label?: string;
  @Input() disabled?: boolean;
  @Input() type?: string;
  @Input() size?: string;
}
