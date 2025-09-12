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

import { ProfessorInformationSectionComponent } from './professor-information-section.component';

describe('ProfessorInformationSectionComponent', () => {
  let component: ProfessorInformationSectionComponent;
  let fixture: ComponentFixture<ProfessorInformationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorInformationSectionComponent, TranslateModule.forRoot()],
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

    fixture = TestBed.createComponent(ProfessorInformationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
