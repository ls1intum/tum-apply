import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { PrivacyPageComponent } from './privacy-page.component';

class FakeLoaderEn implements TranslateLoader {
  getTranslation(): Observable<Record<string, any>> {
    return of({
      privacy: {
        headline: 'Privacy',
        text: 'The Research Group for Applied Education Technologies',
        logging: {
          headline: 'Logging',
          text: 'The web servers of the AET',
        },
        personalData: {
          headline: 'Use and transfer of personal data',
          text: 'Our website can be used without providing personal data',
        },
        dataProcessing: {
          headline: 'Revocation of your consent to data processing',
          text: 'Some data processing operations require your express consent',
        },
        complaint: {
          headline: 'Right to file a complaint with the responsible supervisory authority',
          text: 'You have the right to lodge a complaint',
        },
        dataPortability: {
          headline: 'Right to data portability',
          text: 'You have the right to request the data',
        },
        dataRight: {
          headline: 'Right to information, correction, blocking, and deletion',
          text: 'You have at any time within the framework',
        },
        sslTls: {
          headline: 'SSL/TLS encryption',
          text: 'For security reasons and to protect the transmission',
        },
        emailSec: {
          headline: 'E-mail security',
          text: 'If you e-mail us, your e-mail address will only be used',
        },
      },
    });
  }
}

class FakeLoaderDe implements TranslateLoader {
  getTranslation(): Observable<Record<string, any>> {
    return of({
      privacy: {
        headline: 'Datenschutz',
        text: 'Die Forschungsgruppe für Angewandte Softwaretechnik',
        logging: {
          headline: 'Protokollierung',
          text: 'Die Webserver der ATE',
        },
        personalData: {
          headline: 'Nutzung und Weitergabe personenbezogener Daten',
          text: 'Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich',
        },
        dataProcessing: {
          headline: 'Widerruf Ihrer Einwilligung zur Datenverarbeitung',
          text: 'Einige Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich',
        },
        complaint: {
          headline: 'Beschwerderecht bei der zuständigen Aufsichtsbehörde',
          text: 'Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht',
        },
        dataPortability: {
          headline: 'Recht auf Datenübertragbarkeit',
          text: 'Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung automatisiert verarbeiten',
        },
        dataRight: {
          headline: 'Recht auf Auskunft, Sperrung, Löschung',
          text: 'Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht',
        },
        sslTls: {
          headline: 'SSL- bzw. TLS-Verschlüsselung',
          text: 'Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte',
        },
        emailSec: {
          headline: 'E-Mail-Sicherheit',
          text: 'Wenn Sie uns per E-Mail kontaktieren, wird Ihre E-Mail-Adresse nur für die Korrespondenz verwendet',
        },
      },
    });
  }
}

function expectTextToContain(el: Element | null, expected: string): void {
  const normalizedText = el?.textContent?.replace(/\s+/g, ' ').toLowerCase();
  expect(normalizedText).toContain(expected.toLowerCase());
}

describe('PrivacyPageComponent EN', () => {
  let component: PrivacyPageComponent;
  let fixture: ComponentFixture<PrivacyPageComponent>;
  let translate: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoaderEn },
        }),
        PrivacyPageComponent,
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.use('en');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create (EN)', () => {
    expect(component).toBeTruthy();
  });

  it('should display all translated headlines (EN)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const headlines = [
      { selector: '.headline', expected: 'Privacy' },
      { selector: '[jhiTranslate="privacy.logging.headline"]', expected: 'Logging' },
      { selector: '[jhiTranslate="privacy.personalData.headline"]', expected: 'Use and transfer of personal data' },
      { selector: '[jhiTranslate="privacy.dataProcessing.headline"]', expected: 'Revocation of your consent' },
      { selector: '[jhiTranslate="privacy.complaint.headline"]', expected: 'Right to file a complaint' },
      { selector: '[jhiTranslate="privacy.dataPortability.headline"]', expected: 'Right to data portability' },
      { selector: '[jhiTranslate="privacy.dataRight.headline"]', expected: 'Right to information' },
      { selector: '[jhiTranslate="privacy.sslTls.headline"]', expected: 'SSL/TLS encryption' },
      { selector: '[jhiTranslate="privacy.emailSec.headline"]', expected: 'E-mail security' },
    ];

    headlines.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });

  it('should display all translated texts (EN)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const texts = [
      { selector: '[jhiTranslate="privacy.text"]', expected: 'education technologies' },
      { selector: '[jhiTranslate="privacy.logging.text"]', expected: 'web servers of the AET' },
      { selector: '[jhiTranslate="privacy.personalData.text"]', expected: 'without providing personal data' },
      { selector: '[jhiTranslate="privacy.dataProcessing.text"]', expected: 'express consent' },
      { selector: '[jhiTranslate="privacy.complaint.text"]', expected: 'lodge a complaint' },
      { selector: '[jhiTranslate="privacy.dataPortability.text"]', expected: 'request the data' },
      { selector: '[jhiTranslate="privacy.dataRight.text"]', expected: 'you have at any time' }, // angepasst
      { selector: '[jhiTranslate="privacy.sslTls.text"]', expected: 'protect the transmission' },
      { selector: '[jhiTranslate="privacy.emailSec.text"]', expected: 'e-mail address will only be used' },
    ];
    texts.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expectTextToContain(el, expected);
    });
  });
});

describe('PrivacyPageComponent DE', () => {
  let component: PrivacyPageComponent;
  let fixture: ComponentFixture<PrivacyPageComponent>;
  let translate: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoaderDe },
        }),
        PrivacyPageComponent,
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.use('de');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create (DE)', () => {
    expect(component).toBeTruthy();
  });

  it('should display all translated headlines (DE)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const headlines = [
      { selector: '.headline', expected: 'Datenschutz' },
      { selector: '[jhiTranslate="privacy.logging.headline"]', expected: 'Protokollierung' },
      { selector: '[jhiTranslate="privacy.personalData.headline"]', expected: 'Nutzung und Weitergabe' },
      { selector: '[jhiTranslate="privacy.dataProcessing.headline"]', expected: 'Widerruf Ihrer Einwilligung' },
      { selector: '[jhiTranslate="privacy.complaint.headline"]', expected: 'Beschwerderecht' },
      { selector: '[jhiTranslate="privacy.dataPortability.headline"]', expected: 'Recht auf Datenübertragbarkeit' },
      { selector: '[jhiTranslate="privacy.dataRight.headline"]', expected: 'Recht auf Auskunft' },
      { selector: '[jhiTranslate="privacy.sslTls.headline"]', expected: 'SSL- bzw. TLS-Verschlüsselung' },
      { selector: '[jhiTranslate="privacy.emailSec.headline"]', expected: 'E-Mail-Sicherheit' },
    ];

    headlines.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });

  it('should display all translated texts (DE)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const texts = [
      { selector: '[jhiTranslate="privacy.text"]', expected: 'angewandte softwaretechnik' },
      { selector: '[jhiTranslate="privacy.logging.text"]', expected: 'webserver der ate' },
      { selector: '[jhiTranslate="privacy.personalData.text"]', expected: 'ohne angabe personenbezogener daten' },
      { selector: '[jhiTranslate="privacy.dataProcessing.text"]', expected: 'ausdrücklichen einwilligung' },
      { selector: '[jhiTranslate="privacy.complaint.text"]', expected: 'beschwerderecht' },
      { selector: '[jhiTranslate="privacy.dataPortability.text"]', expected: 'automatisiert verarbeiten' },
      { selector: '[jhiTranslate="privacy.dataRight.text"]', expected: 'jederzeit das recht' }, // angepasst
      { selector: '[jhiTranslate="privacy.sslTls.text"]', expected: 'sicherheitsgründen' },
      { selector: '[jhiTranslate="privacy.emailSec.text"]', expected: 'e-mail kontaktieren' },
    ];
    texts.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expectTextToContain(el, expected);
    });
  });
});
