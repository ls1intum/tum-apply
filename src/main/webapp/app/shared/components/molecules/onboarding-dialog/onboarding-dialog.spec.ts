import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { provideAnimations } from '@angular/platform-browser/animations';

import { OnboardingDialog } from './onboarding-dialog';

describe('OnboardingDialog', () => {
  let component: OnboardingDialog;
  let fixture: ComponentFixture<OnboardingDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingDialog, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
