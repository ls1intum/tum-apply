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

import { ProfessorFaqSectionComponent } from './professor-faq-section.component';

describe('ProfessorFaqSectionComponent', () => {
  let component: ProfessorFaqSectionComponent;
  let fixture: ComponentFixture<ProfessorFaqSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorFaqSectionComponent, TranslateModule.forRoot()],
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

    fixture = TestBed.createComponent(ProfessorFaqSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have FAQ questions data', () => {
    expect(component.tabs).toBeDefined();
    expect(component.tabs.length).toBeGreaterThan(0);
  });

  it('should have correct question structure', () => {
    const firstQuestion = component.tabs[0];
    expect(firstQuestion).toHaveProperty('value');
    expect(firstQuestion).toHaveProperty('title');
    expect(firstQuestion).toHaveProperty('content');
  });
});
