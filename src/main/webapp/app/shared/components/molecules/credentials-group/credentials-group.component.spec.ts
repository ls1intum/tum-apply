import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
        CredentialsGroupComponent,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        ButtonComponent,
        StringInputComponent,
        PasswordInputComponent,
      ],
      providers: [
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
