import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { OtpInput } from './otp-input';

describe('OtpInput', () => {
  let component: OtpInput;
  let fixture: ComponentFixture<OtpInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpInput, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: DynamicDialogConfig, useValue: { data: { forRegistration: true } } },
        { provide: DynamicDialogRef, useValue: { close: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
