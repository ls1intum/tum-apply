import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProfessorRequestAccessFormComponent } from '../../../../../../../../main/webapp/app/shared/components/molecules/onboarding-dialog/professor-request-access-form-component.ts/professor-request-access-form/professor-request-access-form.component';

describe('ProfessorRequestAccessFormComponent', () => {
  let component: ProfessorRequestAccessFormComponent;
  let fixture: ComponentFixture<ProfessorRequestAccessFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorRequestAccessFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorRequestAccessFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
