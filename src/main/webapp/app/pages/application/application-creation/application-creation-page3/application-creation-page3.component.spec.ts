import { ComponentFixture, TestBed } from '@angular/core/testing';

import ApplicationCreationPage3Component from './application-creation-page3.component';

describe('ApplicationCreationPage3Component', () => {
  let component: ApplicationCreationPage3Component;
  let fixture: ComponentFixture<ApplicationCreationPage3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage3Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
