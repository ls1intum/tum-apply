import { Component, input } from '@angular/core';
import { ButtonGroupData } from 'app/shared/components/molecules/button-group/button-group.component';

@Component({
  selector: 'jhi-button-group',
  standalone: true,
  template: '',
})
export class ButtonGroupStubComponent {
  data = input<ButtonGroupData>();
}
