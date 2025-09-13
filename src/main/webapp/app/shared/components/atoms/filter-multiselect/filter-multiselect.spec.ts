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
import { faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';

import { FilterMultiselect } from './filter-multiselect';

describe('FilterMultiselect', () => {
  let component: FilterMultiselect;
  let fixture: ComponentFixture<FilterMultiselect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterMultiselect,
        TranslateModule.forRoot({
          missingTranslationHandler: {
            provide: MissingTranslationHandler,
            useFactory: missingTranslationHandler,
          },
        }),
      ],
      providers: [TranslateStore, TranslateLoader, TranslateCompiler, TranslateParser],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterMultiselect);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('filterLabel', '');
    fixture.componentRef.setInput('filterSearchPlaceholder', '');

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faSearch);
    library.addIcons(faChevronDown);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
