import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationCreationPage2Component } from './application-creation-page2.component';

describe('ApplicationCreationPage2Component', () => {
  let component: ApplicationCreationPage2Component;
  let fixture: ComponentFixture<ApplicationCreationPage2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage2Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
