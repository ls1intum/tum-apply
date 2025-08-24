import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';

import { OtpInput } from './otp-input';

describe('OtpInput', () => {
  let component: OtpInput;
  let fixture: ComponentFixture<OtpInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpInput],
      providers: [provideHttpClient(), importProvidersFrom(TranslateModule.forRoot())],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
