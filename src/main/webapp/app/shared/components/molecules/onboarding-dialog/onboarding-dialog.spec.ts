import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingDialog } from './onboarding-dialog';

describe('OnboardingDialog', () => {
  let component: OnboardingDialog;
  let fixture: ComponentFixture<OnboardingDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
