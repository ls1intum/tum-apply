import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';

import { DoctoralJourneySectionComponent } from './doctoral-journey-section.component';

describe('DoctoralJourneySectionComponent', () => {
  let component: DoctoralJourneySectionComponent;
  let fixture: ComponentFixture<DoctoralJourneySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctoralJourneySectionComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctoralJourneySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
