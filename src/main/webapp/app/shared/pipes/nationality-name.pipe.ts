import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'nationalityName',
  standalone: true,
  pure: false,
})
export class NationalityNamePipe implements PipeTransform {
  translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value == null) {
      return '';
    }

    const key = `nationalities.${value.toLowerCase()}`;
    return this.translate.instant(key);
  }
}
