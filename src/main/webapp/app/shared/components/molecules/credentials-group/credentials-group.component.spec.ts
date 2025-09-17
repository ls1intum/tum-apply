import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonComponent } from '../../atoms/button/button.component';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';

import { CredentialsGroupComponent } from './credentials-group.component';

describe('CredentialsGroupComponent', () => {
  let component: CredentialsGroupComponent;
  let fixture: ComponentFixture<CredentialsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FontAwesomeModule,
        CredentialsGroupComponent,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        ButtonComponent,
        StringInputComponent,
        PasswordInputComponent,
      ],
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

    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const faLibrary = TestBed.inject(FaIconLibrary);
    faLibrary.addIcons(faGoogle);
    faLibrary.addIcons(faApple);

    fixture = TestBed.createComponent(CredentialsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
