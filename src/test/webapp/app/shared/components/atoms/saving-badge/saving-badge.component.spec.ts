import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { SavingBadgeComponent } from 'app/shared/components/atoms/saving-badge/saving-badge.component';
import { SavingState, SavingStates } from 'app/shared/constants/saving-states';

describe('SavingBadgeComponent', () => {
  let fixture: ComponentFixture<SavingBadgeComponent>;
  let component: SavingBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingBadgeComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SavingBadgeComponent);
    component = fixture.componentInstance;
  });

  it.each<{ state: SavingState; colorClass: string; key: string }>([
    { state: SavingStates.SAVED, colorClass: 'text-positive-default', key: 'entity.applicationSteps.status.SAVED' },
    { state: SavingStates.SAVING, colorClass: 'text-warning-default', key: 'entity.applicationSteps.status.SAVING' },
    { state: SavingStates.FAILED, colorClass: 'text-negative-default', key: 'entity.applicationSteps.status.FAILED' },
  ])('should resolve the $colorClass token and the $key translation key when state is $state', ({ state, colorClass, key }) => {
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();

    expect(component.colorClass()).toBe(colorClass);
    expect(component.translationKey()).toBe(key);
  });

  it('should apply the resolved color class to the rendered badge', () => {
    fixture.componentRef.setInput('state', SavingStates.SAVED);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('div');
    expect(badge?.classList).toContain('text-positive-default');
  });
});
