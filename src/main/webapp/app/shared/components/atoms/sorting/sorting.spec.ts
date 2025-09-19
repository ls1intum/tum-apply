import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateStore,
} from '@ngx-translate/core';
import { missingTranslationHandler } from 'app/config/translation.config';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowDown19, faArrowDownAZ, faArrowUp19, faArrowUpAZ, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { Sorting } from './sorting';

describe('Sorting', () => {
  let component: Sorting;
  let fixture: ComponentFixture<Sorting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Sorting,
        TranslateModule.forRoot({
          missingTranslationHandler: {
            provide: MissingTranslationHandler,
            useFactory: missingTranslationHandler,
          },
        }),
      ],
      providers: [TranslateStore, TranslateLoader, TranslateCompiler, TranslateParser],
    }).compileComponents();

    fixture = TestBed.createComponent(Sorting);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('sortableFields', [{ displayName: 'Name', fieldName: 'name', type: 'TEXT' }]);

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown);
    library.addIcons(faArrowUpAZ);
    library.addIcons(faArrowUp19);
    library.addIcons(faArrowDownAZ);
    library.addIcons(faArrowDown19);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
