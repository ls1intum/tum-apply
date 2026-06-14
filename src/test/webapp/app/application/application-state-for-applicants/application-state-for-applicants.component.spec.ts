import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationStateForApplicantsComponent } from 'app/application/application-state-for-applicants/application-state-for-applicants.component';
import { ApplicationDetailDTOApplicationStateEnum } from 'app/generated/model/application-detail-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('ApplicationStateForApplicantsComponent', () => {
  let fixture: ComponentFixture<ApplicationStateForApplicantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStateForApplicantsComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStateForApplicantsComponent);
  });

  afterEach(() => vi.restoreAllMocks());

  function renderedTagCount(): number {
    return fixture.nativeElement.querySelectorAll('jhi-tag').length;
  }

  it('should show a recommendation-missing tag next to a submitted application with missing letters', () => {
    fixture.componentRef.setInput('state', ApplicationDetailDTOApplicationStateEnum.Sent);
    fixture.componentRef.setInput('recommendationMissing', true);
    fixture.detectChanges();

    expect(renderedTagCount()).toBe(2);
  });

  it('should show only the submitted tag when no recommendation is missing', () => {
    fixture.componentRef.setInput('state', ApplicationDetailDTOApplicationStateEnum.Sent);
    fixture.componentRef.setInput('recommendationMissing', false);
    fixture.detectChanges();

    expect(renderedTagCount()).toBe(1);
  });

  it('should not show a recommendation-missing tag for non-submitted states', () => {
    fixture.componentRef.setInput('state', ApplicationDetailDTOApplicationStateEnum.Saved);
    fixture.componentRef.setInput('recommendationMissing', true);
    fixture.detectChanges();

    expect(renderedTagCount()).toBe(1);
  });
});
