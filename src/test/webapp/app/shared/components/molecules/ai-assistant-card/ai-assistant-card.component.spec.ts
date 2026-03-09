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

  it('should map low scores to critical feedback', () => {
    fixture.componentRef.setInput('score', component.dangerThreshold);
    fixture.detectChanges();

    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.critical');
  });

  it('should map medium scores to warning feedback', () => {
    fixture.componentRef.setInput('score', component.dangerThreshold + 1);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.warning');

    fixture.componentRef.setInput('score', component.warningThreshold);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.warning');
  });

  it('should map good and excellent ranges correctly', () => {
    fixture.componentRef.setInput('score', component.warningThreshold + 1);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.good');

    fixture.componentRef.setInput('score', component.excellentThreshold);
    fixture.detectChanges();
    expect(component.scoreFeedback()).toBe('jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.excellent');
  });

  it('should emit generate when onGenerate is called', () => {
    const emitSpy = vi.spyOn(component.generate, 'emit');

    component.onGenerate();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('should dim only the score ring while generating', () => {
    fixture.componentRef.setInput('isGenerating', true);
    fixture.detectChanges();

    const scoreRingWrapper = fixture.nativeElement.querySelector('.ai-score-ring-wrapper');
    const scoreBlock = fixture.nativeElement.querySelector('.ai-score-block');
    expect(scoreRingWrapper.classList.contains('opacity-50')).toBe(true);
    expect(scoreBlock.classList.contains('opacity-50')).toBe(false);
  });

  it('should keep displaying the previous score during generation and update afterwards', () => {
    fixture.componentRef.setInput('score', 42);
    fixture.detectChanges();
    expect(component.displayedScore()).toBe(42);

    fixture.componentRef.setInput('isGenerating', true);
    fixture.componentRef.setInput('score', 84);
    fixture.detectChanges();
    expect(component.displayedScore()).toBe(42);

    fixture.componentRef.setInput('isGenerating', false);
    fixture.detectChanges();
    expect(component.displayedScore()).toBe(84);
  });

  it('should still show generating indicator while generating', () => {
    fixture.componentRef.setInput('isGenerating', true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('jhi-progress-spinner');
    expect(spinner).toBeTruthy();
  });
});
