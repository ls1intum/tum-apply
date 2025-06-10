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

import { ApplicationStepComponent } from './application-step.component';

describe('ApplicationStepComponent', () => {
  let component: ApplicationStepComponent;
  let fixture: ComponentFixture<ApplicationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepComponent, TranslateModule.forRoot(), FontAwesomeModule],
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

    fixture = TestBed.createComponent(ApplicationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
