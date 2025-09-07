import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';

import { ProfOnboardingResourceService } from '../../../../generated';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

/**
 * Professor onboarding dialog.
 */
@Component({
  selector: 'jhi-onboarding-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslateModule, ButtonComponent, TranslateDirective, MessageModule],
  templateUrl: './onboarding-dialog.html',
  styleUrls: ['./onboarding-dialog.scss'], // <-- PLURAL
})
export class OnboardingDialog {
  static readonly MAILTO = (() => {
    const subject = 'Anfrage: Zugriff zu Lehrstuhl / Professur in TUMApply';
    const body = [
      '=== ANLEITUNG ===',
      '- Füllen Sie die Felder unten aus.',
      '- Diese Anweisungen dürfen Sie vollständig löschen.',
      '',
      'Bitte ändere den Betreff dieser Email nicht.',
      '=== /ANLEITUNG ===',
      '',
      'Persönliche Informationen:',
      '- Titel (Prof./Dr./…): <TITLE>',
      '- Vorname: <FIRST_NAME>',
      '- Nachname: <LAST_NAME>',
      '- TUM-ID (z.B. ab12cde): <UNIVERSITY_ID>',
      '',
      'Notwendige Angaben zum Lehrstuhl / zur Professur:',
      '- Leitung (Titel, Vor- und Nachname):  <RG_NAME_DE>',
      '- Name: <RG_NAME_EN>',
      '',
      'Optionale Angaben zum Lehstuhl / zur Professur:',
      '- Abkürzung: <NAMES_OR_EMAILS>',
      '- Email: <NOTES>',
      '- Webseite: <WEBSITE>',
      '- School: <URL>',
      '- Beschreibung: <NOTES>',
      '- Standard Studienfach: <DEFAULT_FIELD_OF_STUDIES',
      '- Adresse:',
      '  - Straße und Hausnummer: <STREET_AND_NUMBER>',
      '  - Postleitzahl: <ZIP_CODE>',
      '  - Stadt: <CITY>',
    ].join('\n');

    return `mailto:support-tum-apply.aet@xcit.tum.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();
  ref = input<DynamicDialogRef | null>(null);
  private api = inject(ProfOnboardingResourceService);

  markOnboarded(): void {
    window.location.href = OnboardingDialog.MAILTO;
    // void firstValueFrom(this.api.confirmOnboarding()).catch();
    this.ref()?.close();
  }
}
