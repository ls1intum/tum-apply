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
import { Sorting } from 'app/shared/components/atoms/sorting/sorting';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

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
      providers: [TranslateStore, TranslateLoader, TranslateCompiler, TranslateParser, provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Sorting);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('sortableFields', [{ displayName: 'Name', fieldName: 'name', type: 'TEXT' }]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
