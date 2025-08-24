import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'genderName',
  standalone: true,
  pure: false,
})
export class GenderNamePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value == null) return '';

    const key = `genders.${value.toLowerCase()}`;
    const translated = this.translate.instant(key);

    return translated !== key ? translated : value;
  }
}
