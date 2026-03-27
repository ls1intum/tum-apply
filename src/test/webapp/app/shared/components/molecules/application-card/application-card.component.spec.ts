import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationCardComponent } from 'app/shared/components/molecules/application-card/application-card.component';
import { ApplicationEvaluationDetailDTO } from 'app/generated/models/application-evaluation-detail-dto';
import { ApplicationDetailDTO } from 'app/generated/models/application-detail-dto';
import { provideTranslateMock } from '../../../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { provideThemeServiceMock } from '../../../../../util/theme.service.mock';

describe('ApplicationCardComponent', () => {
  let fixture: ComponentFixture<ApplicationCardComponent>;
  let component: ApplicationCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCardComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting(), provideThemeServiceMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------- applicationDetails ----------------
  it('returns undefined when application is not set', () => {
    expect(component.applicationDetails()).toBeUndefined();
  });

  it('returns applicationDetailDTO when application is provided', () => {
    const detail: ApplicationDetailDTO = { applicationId: '123' } as ApplicationDetailDTO;
    const app: ApplicationEvaluationDetailDTO = { applicationDetailDTO: detail } as ApplicationEvaluationDetailDTO;

    fixture.componentRef.setInput('application', app);
    fixture.detectChanges();

    expect(component.applicationDetails()).toBe(detail);
  });

  // ---------------- stateSeverityMap ----------------
  it('maps states to severities correctly', () => {
    expect(component.stateSeverityMap.SENT).toBe('info');
    expect(component.stateSeverityMap.ACCEPTED).toBe('success');
    expect(component.stateSeverityMap.REJECTED).toBe('danger');
    expect(component.stateSeverityMap.IN_REVIEW).toBe('warn');
  });

  // ---------------- PLACEHOLDER STATE ----------------

  it('should render content when placeholder is false', () => {
    const detail: ApplicationDetailDTO = {
      applicationId: '123',
      applicant: { user: { name: 'John Doe' } },
      applicationState: 'SENT',
      jobTitle: 'Software Engineer',
    } as ApplicationDetailDTO;
    const app: ApplicationEvaluationDetailDTO = { applicationDetailDTO: detail } as ApplicationEvaluationDetailDTO;

    fixture.componentRef.setInput('placeholder', false);
    fixture.componentRef.setInput('application', app);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('h2');
    expect(header).toBeTruthy();
  });
});
