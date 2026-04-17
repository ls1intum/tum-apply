import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { JobCardDTOSubjectAreaEnum as SubjectAreaEnum } from 'app/generated/model/job-card-dto';
import { FilterChange, FilterMultiselect } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { SubjectAreaSubscriptionSelectorComponent } from 'app/shared/settings/notifications/subject-area-subscription-selector.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

describe('SubjectAreaSubscriptionSelectorComponent', () => {
  let fixture: ComponentFixture<SubjectAreaSubscriptionSelectorComponent>;
  let component: SubjectAreaSubscriptionSelectorComponent;

  const computerScienceOption = {
    name: 'subjectAreas.ComputerScience',
    value: SubjectAreaEnum.ComputerScience,
  };
  const mathematicsOption = {
    name: 'subjectAreas.Mathematics',
    value: SubjectAreaEnum.Mathematics,
  };

  const setInputs = (
    overrides: Partial<{
      saving: boolean;
      filterOptions: string[];
      selectedValues: string[];
      selectedOptions: Array<{ name: string; value: SubjectAreaEnum }>;
    }> = {},
  ) => {
    fixture.componentRef.setInput('saving', overrides.saving ?? false);
    fixture.componentRef.setInput('filterOptions', overrides.filterOptions ?? [computerScienceOption.name, mathematicsOption.name]);
    fixture.componentRef.setInput('selectedValues', overrides.selectedValues ?? []);
    fixture.componentRef.setInput('selectedOptions', overrides.selectedOptions ?? []);
    fixture.detectChanges();
  };

  const getFilterMultiselect = (): FilterMultiselect => {
    const filterMultiselect = component['filterMultiselect']();
    if (!filterMultiselect) {
      throw new Error('Expected filter multiselect child to be available');
    }
    return filterMultiselect;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectAreaSubscriptionSelectorComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectAreaSubscriptionSelectorComponent);
    component = fixture.componentInstance;
    setInputs();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should render the empty state when no subject areas are selected and the dropdown is closed', () => {
    const emptyState = fixture.nativeElement.querySelector('p.text-text-secondary');

    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('settings.notifications.applicant.subjectAreas.emptySelection');
  });

  it('should render selected subject area chips when the dropdown is closed', () => {
    setInputs({
      selectedValues: [computerScienceOption.name, mathematicsOption.name],
      selectedOptions: [computerScienceOption, mathematicsOption],
    });

    const removeButtons = fixture.nativeElement.querySelectorAll('button[aria-label]');
    const renderedText = fixture.nativeElement.textContent ?? '';

    expect(renderedText).toContain(computerScienceOption.name);
    expect(renderedText).toContain(mathematicsOption.name);
    expect(removeButtons).toHaveLength(2);
  });

  it('should hide chips and the empty state while the dropdown is open', () => {
    setInputs({
      selectedValues: [computerScienceOption.name],
      selectedOptions: [computerScienceOption],
    });

    getFilterMultiselect().isOpen.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button[aria-label]')).toBeNull();
    expect(fixture.nativeElement.querySelector('p.text-text-secondary')).toBeNull();
  });

  it('should emit filter changes from the multiselect', () => {
    const emitSpy = vi.spyOn(component.filterChange, 'emit');
    const filterChange: FilterChange = { filterId: 'subject-areas', selectedValues: [computerScienceOption.name] };

    getFilterMultiselect().filterChange.emit(filterChange);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith(filterChange);
  });

  it('should emit the removed subject area after the remove animation finishes', () => {
    vi.useFakeTimers();
    setInputs({
      selectedValues: [computerScienceOption.name],
      selectedOptions: [computerScienceOption],
    });
    const emitSpy = vi.spyOn(component.removeSubjectArea, 'emit');

    const removeButton = fixture.nativeElement.querySelector('button[aria-label]') as HTMLButtonElement | null;
    removeButton?.click();

    expect(component['removingSubjectArea']()).toBe(SubjectAreaEnum.ComputerScience);
    expect(emitSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
    expect(component['removingSubjectArea']()).toBeUndefined();
  });

  it('should ignore additional remove requests while a removal animation is already running', () => {
    vi.useFakeTimers();
    const emitSpy = vi.spyOn(component.removeSubjectArea, 'emit');

    component.onRemoveSubjectArea(SubjectAreaEnum.ComputerScience);
    component.onRemoveSubjectArea(SubjectAreaEnum.Mathematics);

    vi.advanceTimersByTime(150);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
  });
});
