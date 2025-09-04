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
import { faBell, faInfo, faPaperPlane, faSearch } from '@fortawesome/free-solid-svg-icons';
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
    library.addIcons(faBell);
    library.addIcons(faSearch);
    library.addIcons(faPaperPlane);
    library.addIcons(faInfo);

    fixture = TestBed.createComponent(ProfessorWorkflowSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
