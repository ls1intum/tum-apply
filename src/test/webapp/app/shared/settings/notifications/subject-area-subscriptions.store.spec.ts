import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { JobCardDTOSubjectAreaEnum as SubjectAreaEnum } from 'app/generated/model/job-card-dto';
import { SubjectAreaSubscriptionsStore } from 'app/shared/settings/notifications/subject-area-subscriptions.store';
import { createApplicantResourceApiMock, provideApplicantResourceApiMock } from 'util/applicant-resource-api.service.mock';
import { createToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';

describe('SubjectAreaSubscriptionsStore', () => {
  let store: SubjectAreaSubscriptionsStore;

  const applicantApiMock = createApplicantResourceApiMock();
  const toastServiceMock = createToastServiceMock();

  const createStore = () => TestBed.runInInjectionContext(() => new SubjectAreaSubscriptionsStore());

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [provideApplicantResourceApiMock(applicantApiMock), provideToastServiceMock(toastServiceMock)],
    });

    store = createStore();
  });

  it('should load and sort subject area subscriptions based on dropdown option order', async () => {
    applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.Mathematics, SubjectAreaEnum.ComputerScience]));

    await store.load();

    expect(store.selected()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
    expect(store.selectedFilterValues()).toEqual([
      'jobCreationForm.basicInformationSection.subjectAreas.ComputerScience',
      'jobCreationForm.basicInformationSection.subjectAreas.Mathematics',
    ]);
    expect(store.selectedOptions().map(option => option.value)).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
  });

  it('should reset the selection and show a toast when loading subscriptions fails', async () => {
    store.selected.set([SubjectAreaEnum.ComputerScience]);
    applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(throwError(() => new Error('load failed')));

    await store.load();

    expect(store.selected()).toEqual([]);
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.applicant.subjectAreas.loadFailed');
  });

  it('should call add and remove subscription endpoints for the selection diff', async () => {
    store.selected.set([SubjectAreaEnum.ComputerScience]);
    applicantApiMock.addSubjectAreaSubscription.mockReturnValue(of(undefined));
    applicantApiMock.removeSubjectAreaSubscription.mockReturnValue(of(undefined));

    await store.updateSelection([SubjectAreaEnum.Mathematics]);

    expect(applicantApiMock.addSubjectAreaSubscription).toHaveBeenCalledOnce();
    expect(applicantApiMock.addSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.Mathematics);
    expect(applicantApiMock.removeSubjectAreaSubscription).toHaveBeenCalledOnce();
    expect(applicantApiMock.removeSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
    expect(store.selected()).toEqual([SubjectAreaEnum.Mathematics]);
    expect(store.saving()).toBe(false);
  });

  it('should not call any subscription endpoints when the selection does not change', async () => {
    store.selected.set([SubjectAreaEnum.ComputerScience]);

    await store.updateSelection([SubjectAreaEnum.ComputerScience]);

    expect(applicantApiMock.addSubjectAreaSubscription).not.toHaveBeenCalled();
    expect(applicantApiMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
    expect(store.saving()).toBe(false);
  });

  it('should restore the previous selection and reload when updating subscriptions fails', async () => {
    store.selected.set([SubjectAreaEnum.ComputerScience]);
    applicantApiMock.addSubjectAreaSubscription.mockReturnValue(throwError(() => new Error('save failed')));
    applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));
    const loadSpy = vi.spyOn(store, 'load');

    await store.updateSelection([SubjectAreaEnum.Mathematics]);

    expect(store.selected()).toEqual([SubjectAreaEnum.ComputerScience]);
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.applicant.subjectAreas.saveFailed');
    expect(loadSpy).toHaveBeenCalledOnce();
    expect(applicantApiMock.getSubjectAreaSubscriptions).toHaveBeenCalledOnce();
    expect(store.saving()).toBe(false);
  });

  it('should remove a subject area by delegating to updateSelection', async () => {
    store.selected.set([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
    applicantApiMock.removeSubjectAreaSubscription.mockReturnValue(of(undefined));
    const updateSelectionSpy = vi.spyOn(store, 'updateSelection');

    await store.remove(SubjectAreaEnum.ComputerScience);

    expect(updateSelectionSpy).toHaveBeenCalledOnce();
    expect(updateSelectionSpy).toHaveBeenCalledWith([SubjectAreaEnum.Mathematics]);
  });

  it('should map filter labels to subject areas when the multiselect changes', async () => {
    const updateSelectionSpy = vi.spyOn(store, 'updateSelection').mockResolvedValue();

    store.onFilterChange({
      filterId: 'subject-areas',
      selectedValues: [
        'jobCreationForm.basicInformationSection.subjectAreas.ComputerScience',
        'jobCreationForm.basicInformationSection.subjectAreas.Mathematics',
      ],
    });

    await Promise.resolve();

    expect(updateSelectionSpy).toHaveBeenCalledOnce();
    expect(updateSelectionSpy).toHaveBeenCalledWith([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
  });
});
