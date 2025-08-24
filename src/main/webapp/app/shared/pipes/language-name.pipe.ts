import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'languageName',
  standalone: true,
  pure: false,
})
export class LanguageNamePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value == null) return '';

    const key = `languages.${value.toLowerCase()}`;
    const translated = this.translate.instant(key);

    return translated !== key ? translated : value;
  }
}
