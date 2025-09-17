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
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfessorLandingPageComponent } from './professor-landing-page.component';

describe('ProfessorLandingPageComponent', () => {
  let component: ProfessorLandingPageComponent;
  let fixture: ComponentFixture<ProfessorLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorLandingPageComponent, TranslateModule.forRoot(), FontAwesomeModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faCalendarCheck);
    library.addIcons(faFilePen);
    library.addIcons(faFolderOpen);
    library.addIcons(faStar);

    fixture = TestBed.createComponent(ProfessorLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
