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
import { faBriefcase, faCheck, faCommentAlt, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';

import { TagComponent } from '../../atoms/tag/tag.component';
import { RatingComponent } from '../../atoms/rating/rating.component';
import { ButtonComponent } from '../../atoms/button/button.component';

import { ApplicationCardComponent } from './application-card.component';

describe('ApplicationCardComponent', () => {
  let component: ApplicationCardComponent;
  let fixture: ComponentFixture<ApplicationCardComponent>;

  const mockApplication: ApplicationEvaluationDetailDTO = {
    applicationDetailDTO: {
      applicationId: '123',
      applicationState: 'SENT',
    },
    jobTitle: 'AI Researcher',
    rating: 4,
  } as ApplicationEvaluationDetailDTO;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCardComponent, FontAwesomeModule, TagComponent, RatingComponent, ButtonComponent, TranslateModule.forRoot()],
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

    // Register the required FontAwesome icons
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faBriefcase, faCommentAlt, faCheck, faXmark);

    fixture = TestBed.createComponent(ApplicationCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('application', mockApplication);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not have "disabled" class by default', () => {
    const cardEl: HTMLElement = fixture.nativeElement.querySelector('.card');
    expect(cardEl.classList).not.toContain('disabled');
  });

  it('should apply "disabled" class when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const cardEl: HTMLElement = fixture.nativeElement.querySelector('.card');
    expect(cardEl.classList).toContain('disabled');
  });
});
