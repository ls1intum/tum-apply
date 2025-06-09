import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationStepComponent } from './application-step.component';

describe('ApplicationStepComponent', () => {
  let component: ApplicationStepComponent;
  let fixture: ComponentFixture<ApplicationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
