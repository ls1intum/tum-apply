import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import TranslateDirective from '../../language/translate.directive';
import { ImprintPageComponent } from './imprint-page.component';

class FakeLoaderEn implements TranslateLoader {
  getTranslation(lang: string) {
    return of({
      imprint: {
        headline: 'Imprint',
        publisher: {
          headline: 'Publisher',
          contact:
            "Technical University of Munich<br>Postal address: Arcisstrasse 21, 80333 Munich<br>Telephone: <a href='tel:+498928901' class='external-link'>+49-(0)89-289-01</a><br>Fax: +49-(0)89-289-22000<br>Email: <a href='mailto:poststelle@tum.de' class='external-link'>poststelle(at)tum.de</a>",
        },
        authorized: {
          headline: 'Authorized to represent',
          text: 'The Technical University of Munich is legally represented by the President Prof. Dr. Thomas F. Hofmann.',
        },
        vat: {
          headline: 'VAT identification number',
          text: 'DE811193231 (in accordance with § 27a of the German VAT tax act - UStG)',
        },
        responsibility: {
          headline: 'Responsible for content',
          text: 'Prof. Dr. Stephan Krusche<br>Boltzmannstrasse 3<br>85748 Garching',
        },
        tou: {
          headline: 'Terms of use',
          text: 'Texts, images, graphics as well as the design of these Internet pages may be subject to copyright.',
        },
        liability: {
          headline: 'Liability disclaimer',
          text: 'The information provided on this website has been collected and verified to the best of our knowledge and belief.',
        },
        links: {
          headline: 'Links',
          text: 'Our own content is to be distinguished from cross-references (“links”) to websites of other providers.',
        },
      },
    });
  }
}

class FakeLoaderDe implements TranslateLoader {
  getTranslation(lang: string) {
    return of({
      imprint: {
        headline: 'Impressum',
        publisher: {
          headline: 'Herausgeber',
          contact:
            "Technische Universität München<br>Postanschrift: Arcisstraße 21, 80333 München<br>Telephone: <a href='tel:+498928901' class='external-link'>+49-(0)89-289-01</a><br>Telefax: +49-(0)89-289-22000<br>Email: <a href='mailto:poststelle@tum.de' class='external-link'>poststelle(at)tum.de</a>",
        },
        authorized: {
          headline: 'Vertretungsberechtigt',
          text: 'Die Technische Universität München wird gesetzlich vertreten durch den Präsidenten Prof. Dr. Thomas F. Hofmann.',
        },
        vat: {
          headline: 'Umsatzsteueridentifikationsnummer',
          text: 'DE811193231 (gemäß § 27a Umsatzsteuergesetz)',
        },
        responsibility: {
          headline: 'Verantwortlich für den Inhalt',
          text: 'Prof. Dr. Stephan Krusche<br>Boltzmannstrasse 3<br>85748 Garching',
        },
        tou: {
          headline: 'Nutzungsbedingungen',
          text: 'Texte, Bilder, Grafiken sowie die Gestaltung dieser Internetseiten können dem Urheberrecht unterliegen.',
        },
        liability: {
          headline: 'Haftungsausschluss',
          text: 'Alle auf dieser Internetseite bereitgestellten Informationen haben wir nach bestem Wissen und Gewissen erarbeitet und geprüft.',
        },
        links: {
          headline: 'Links',
          text: 'Von unseren eigenen Inhalten sind Querverweise („Links“) auf die Webseiten anderer Anbieter zu unterscheiden.',
        },
      },
    });
  }
}

describe('ImprintPageComponent EN', () => {
  let component: ImprintPageComponent;
  let fixture: ComponentFixture<ImprintPageComponent>;
  let translate: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateDirective,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoaderEn },
        }),
        ImprintPageComponent,
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.use('en');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImprintPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create (EN)', () => {
    expect(component).toBeTruthy();
  });

  it('should display all translated headlines (EN)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const headlines = [
      { selector: '.headline', expected: 'Imprint' },
      { selector: '[jhiTranslate="imprint.publisher.headline"]', expected: 'Publisher' },
      { selector: '[jhiTranslate="imprint.authorized.headline"]', expected: 'Authorized to represent' },
      { selector: '[jhiTranslate="imprint.vat.headline"]', expected: 'VAT identification number' },
      { selector: '[jhiTranslate="imprint.responsibility.headline"]', expected: 'Responsible for content' },
      { selector: '[jhiTranslate="imprint.tou.headline"]', expected: 'Terms of use' },
      { selector: '[jhiTranslate="imprint.liability.headline"]', expected: 'Liability disclaimer' },
      { selector: '[jhiTranslate="imprint.links.headline"]', expected: 'Links' },
    ];

    headlines.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });

  it('should display all translated texts (EN)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const texts = [
      { selector: '[jhiTranslate="imprint.publisher.contact"]', expected: 'Technical University of Munich' },
      { selector: '[jhiTranslate="imprint.authorized.text"]', expected: 'legally represented by the President' },
      { selector: '[jhiTranslate="imprint.vat.text"]', expected: 'DE811193231' },
      { selector: '[jhiTranslate="imprint.responsibility.text"]', expected: 'Prof. Dr. Stephan Krusche' },
      { selector: '[jhiTranslate="imprint.tou.text"]', expected: 'Texts, images, graphics' },
      { selector: '[jhiTranslate="imprint.liability.text"]', expected: 'collected and verified to the best of our knowledge' },
      { selector: '[jhiTranslate="imprint.links.text"]', expected: 'cross-references (“links”) to websites' },
    ];

    texts.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });
});

describe('ImprintPageComponent DE', () => {
  let component: ImprintPageComponent;
  let fixture: ComponentFixture<ImprintPageComponent>;
  let translate: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateDirective,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoaderDe },
        }),
        ImprintPageComponent,
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.use('de');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImprintPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create (DE)', () => {
    expect(component).toBeTruthy();
  });

  it('should display all translated headlines (DE)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const headlines = [
      { selector: '.headline', expected: 'Impressum' },
      { selector: '[jhiTranslate="imprint.publisher.headline"]', expected: 'Herausgeber' },
      { selector: '[jhiTranslate="imprint.authorized.headline"]', expected: 'Vertretungsberechtigt' },
      { selector: '[jhiTranslate="imprint.vat.headline"]', expected: 'Umsatzsteueridentifikationsnummer' },
      { selector: '[jhiTranslate="imprint.responsibility.headline"]', expected: 'Verantwortlich für den Inhalt' },
      { selector: '[jhiTranslate="imprint.tou.headline"]', expected: 'Nutzungsbedingungen' },
      { selector: '[jhiTranslate="imprint.liability.headline"]', expected: 'Haftungsausschluss' },
      { selector: '[jhiTranslate="imprint.links.headline"]', expected: 'Links' },
    ];

    headlines.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });

  it('should display all translated texts (DE)', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const texts = [
      { selector: '[jhiTranslate="imprint.publisher.contact"]', expected: 'Technische Universität München' },
      { selector: '[jhiTranslate="imprint.authorized.text"]', expected: 'gesetzlich vertreten durch den Präsidenten' },
      { selector: '[jhiTranslate="imprint.vat.text"]', expected: 'DE811193231' },
      { selector: '[jhiTranslate="imprint.responsibility.text"]', expected: 'Prof. Dr. Stephan Krusche' },
      { selector: '[jhiTranslate="imprint.tou.text"]', expected: 'Texte, Bilder, Grafiken' },
      { selector: '[jhiTranslate="imprint.liability.text"]', expected: 'nach bestem Wissen und Gewissen erarbeitet und geprüft' },
      { selector: '[jhiTranslate="imprint.links.text"]', expected: 'Querverweise („Links“) auf die Webseiten anderer Anbieter' },
    ];

    texts.forEach(({ selector, expected }) => {
      const el = compiled.querySelector(selector);
      expect(el?.textContent).toContain(expected);
    });
  });
});
