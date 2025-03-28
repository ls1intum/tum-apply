import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findLanguageFromKey',
})
export default class FindLanguageFromKeyPipe implements PipeTransform {
  private readonly languages: Record<string, { name: string; rtl?: boolean }> = {
    en: { name: 'English' },
    de: { name: 'Deutsch' },
  };

  transform(lang: string): string {
    return this.languages[lang].name;
  }
}
