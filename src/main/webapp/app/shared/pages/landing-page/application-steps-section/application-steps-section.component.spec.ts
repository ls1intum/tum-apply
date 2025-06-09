import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationStepsSectionComponent } from './application-steps-section.component';

describe('ApplicationStepsSectionComponent', () => {
  let component: ApplicationStepsSectionComponent;
  let fixture: ComponentFixture<ApplicationStepsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStepsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
