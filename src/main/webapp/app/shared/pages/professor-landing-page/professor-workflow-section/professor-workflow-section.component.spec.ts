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
import { faCalendarCheck, faFilePen, faFolderOpen, faStar } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ProfessorWorkflowSectionComponent } from './professor-workflow-section.component';

describe('ProfessorWorkflowSectionComponent', () => {
  let component: ProfessorWorkflowSectionComponent;
  let fixture: ComponentFixture<ProfessorWorkflowSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorWorkflowSectionComponent, TranslateModule.forRoot(), FontAwesomeModule],
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

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faCalendarCheck);
    library.addIcons(faFilePen);
    library.addIcons(faFolderOpen);
    library.addIcons(faStar);

    fixture = TestBed.createComponent(ProfessorWorkflowSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
