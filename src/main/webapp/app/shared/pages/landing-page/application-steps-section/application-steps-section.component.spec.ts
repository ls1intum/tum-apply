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

import { ApplicationStepsSectionComponent } from './application-steps-section.component';

describe('ApplicationStepsSectionComponent', () => {
  let component: ApplicationStepsSectionComponent;
  let fixture: ComponentFixture<ApplicationStepsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepsSectionComponent, TranslateModule.forRoot(), FontAwesomeModule],
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

    fixture = TestBed.createComponent(ApplicationStepsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
