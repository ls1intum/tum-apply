import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { ProfileComponent } from 'app/shared/components/molecules/profile/profile.component';

import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from '../../../../../util/auth-orchestrator.service.mock';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let authOrchestratorMock: AuthOrchestratorServiceMock;

  function createComponent(): ComponentFixture<ProfileComponent> {
    const createdFixture = TestBed.createComponent(ProfileComponent);
    createdFixture.detectChanges();
    return createdFixture;
  }

  beforeEach(async () => {
    authOrchestratorMock = createAuthOrchestratorServiceMock();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideAuthOrchestratorServiceMock(authOrchestratorMock), provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();

    fixture = createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create component with invalid form initially', () => {
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.form.contains('firstName')).toBe(true);
    expect(component.form.contains('lastName')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('should call submitHandler with first and last name when form is valid and not loading', () => {
    const component = fixture.componentInstance;
    const submitSpy = vi.fn();

    fixture.componentRef.setInput('submitHandler', submitSpy);

    component.form.controls.firstName.setValue('Ada');
    component.form.controls.lastName.setValue('Lovelace');

    component.onSubmit();

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith('Ada', 'Lovelace');
  });

  it('should not call submitHandler when form is invalid', () => {
    const component = fixture.componentInstance;
    const submitSpy = vi.fn();

    fixture.componentRef.setInput('submitHandler', submitSpy);

    component.form.controls.firstName.setValue('Ada');

    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should not call submitHandler when loading is true', () => {
    authOrchestratorMock.isBusy.mockReturnValue(true);

    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const submitSpy = vi.fn();

    fixture.componentRef.setInput('submitHandler', submitSpy);

    component.form.controls.firstName.setValue('Ada');
    component.form.controls.lastName.setValue('Lovelace');

    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
  });
});
