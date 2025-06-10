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
import { provideAnimations } from '@angular/platform-browser/animations';

import { FaqSectionComponent } from './faq-section.component';

describe('FaqSectionComponent', () => {
  let component: FaqSectionComponent;
  let fixture: ComponentFixture<FaqSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqSectionComponent, TranslateModule.forRoot()],
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
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
