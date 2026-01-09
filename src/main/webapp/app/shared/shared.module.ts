import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import FindLanguageFromKeyPipe from './language/find-language-from-key.pipe';
import LocalizedDatePipe from './pipes/localized-date.pipe';
import TranslateDirective from './language/translate.directive';

/**
 * Application wide Module
 */
@NgModule({
  imports: [FindLanguageFromKeyPipe, TranslateDirective, LocalizedDatePipe],
  exports: [CommonModule, NgbModule, FontAwesomeModule, TranslateModule, FindLanguageFromKeyPipe, TranslateDirective, LocalizedDatePipe],
})
export default class SharedModule {}
