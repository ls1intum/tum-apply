import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';

@Component({
  selector: 'jhi-department-images',
  imports: [BackButtonComponent, TranslateModule],
  templateUrl: './department-images.component.html',
})
export class DepartmentImages {}
