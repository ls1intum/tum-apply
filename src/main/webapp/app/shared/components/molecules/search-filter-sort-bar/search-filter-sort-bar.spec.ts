import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
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

import { SearchFilterSortBar } from './search-filter-sort-bar';

describe('SearchFilterSortBar', () => {
  let component: SearchFilterSortBar;
  let fixture: ComponentFixture<SearchFilterSortBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchFilterSortBar,
        TranslateModule.forRoot({
          missingTranslationHandler: {
            provide: MissingTranslationHandler,
            useFactory: missingTranslationHandler,
          },
        }),
      ],
      providers: [TranslateStore, TranslateLoader, TranslateCompiler, TranslateParser],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilterSortBar);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('singleEntity', '');
    fixture.componentRef.setInput('multipleEntities', '');

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faSearch);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
