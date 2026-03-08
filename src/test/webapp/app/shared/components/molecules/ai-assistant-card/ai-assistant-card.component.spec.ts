import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { AiAssistantCardComponent } from 'app/shared/components/molecules/ai-assistant-card/ai-assistant-card.component';

describe('AiAssistantCardComponent', () => {
  let fixture: ComponentFixture<AiAssistantCardComponent>;
  let component: AiAssistantCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAssistantCardComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistantCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('maps low scores to critical feedback', () => {
    fixture.componentRef.setInput('score', component.dangerThreshold);
    fixture.detectChanges();

    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.critical');
  });

  it('maps medium scores to warning feedback', () => {
    fixture.componentRef.setInput('score', component.dangerThreshold + 1);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.warning');

    fixture.componentRef.setInput('score', component.warningThreshold);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.warning');
  });

  it('maps good and excellent ranges correctly', () => {
    fixture.componentRef.setInput('score', component.warningThreshold + 1);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.good');

    fixture.componentRef.setInput('score', component.excellentThreshold);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.excellent');
  });

  it('emits generate when onGenerate is called', () => {
    const emitSpy = vi.spyOn(component.generate, 'emit');

    component.onGenerate();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
