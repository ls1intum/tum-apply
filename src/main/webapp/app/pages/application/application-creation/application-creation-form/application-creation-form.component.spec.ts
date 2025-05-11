import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationCreationFormComponent } from './application-creation-form.component';

describe('ApplicationCreationFormComponent', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
