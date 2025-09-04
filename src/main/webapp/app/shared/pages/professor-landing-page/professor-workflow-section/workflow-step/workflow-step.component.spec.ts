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
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarCheck, faFilePen, faFolderOpen, faStar } from '@fortawesome/free-solid-svg-icons';

import { WorkflowStepComponent } from './workflow-step.component';

describe('WorkflowStepComponent', () => {
  let component: WorkflowStepComponent;
  let fixture: ComponentFixture<WorkflowStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowStepComponent, TranslateModule.forRoot(), FontAwesomeModule],
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

    fixture = TestBed.createComponent(WorkflowStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
