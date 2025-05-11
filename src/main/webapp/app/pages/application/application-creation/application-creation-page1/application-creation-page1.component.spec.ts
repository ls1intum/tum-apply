import { ComponentFixture, TestBed } from '@angular/core/testing';

import ApplicationCreationPage1Component from './application-creation-page1.component';

describe('ApplicationCreationPage1Component', () => {
  let component: ApplicationCreationPage1Component;
  let fixture: ComponentFixture<ApplicationCreationPage1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage1Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
