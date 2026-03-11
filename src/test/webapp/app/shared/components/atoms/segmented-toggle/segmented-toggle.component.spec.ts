import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SegmentedToggleComponent, SegmentedToggleValue } from 'app/shared/components/atoms/segmented-toggle/segmented-toggle.component';
import { provideTranslateMock } from 'util/translate.mock';

type SegmentedToggleForTest = {
  value: SegmentedToggleValue;
  disabled: boolean;
  leftLabel: string;
  rightLabel: string;
  translateLabels: boolean;
};

describe('SegmentedToggleComponent', () => {
  function createFixture(overrideInputs: Partial<SegmentedToggleForTest> = {}) {
    const fixture = TestBed.createComponent(SegmentedToggleComponent);

    const defaults: Partial<SegmentedToggleForTest> = {
      value: 'left',
      disabled: false,
      leftLabel: 'Left',
      rightLabel: 'Right',
      translateLabels: false,
    };

    const inputs = Object.assign({}, defaults, overrideInputs);

    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key as keyof SegmentedToggleForTest, value);
    });

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedToggleComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();
  });

  it('should emit valueChange when clicking the non-selected button', () => {
    const fixture = createFixture({ value: 'left' });
    const emitSpy = vi.spyOn(fixture.componentInstance.valueChange, 'emit');

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();

    expect(emitSpy).toHaveBeenCalledWith('right');
  });

  it('should not emit valueChange when disabled', () => {
    const fixture = createFixture({ value: 'left', disabled: true });
    const emitSpy = vi.spyOn(fixture.componentInstance.valueChange, 'emit');

    fixture.componentInstance.setValue('right');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should disable both buttons when disabled is true', () => {
    const fixture = createFixture({ disabled: true });
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
