import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import ButtonGroupComponent, { ButtonGroupData } from 'app/shared/components/molecules/button-group/button-group.component';

describe('ButtonGroupComponent', () => {
  function createButtonFixture(overrideData?: Partial<ButtonGroupData>) {
    const fixture = TestBed.createComponent(ButtonGroupComponent);

    const defaultData: ButtonGroupData = {
      direction: 'vertical',
      buttons: [
        {
          severity: 'primary',
          disabled: false,
          label: 'Button 1',
          onClick: vi.fn(),
        },
      ],
    };

    fixture.componentRef.setInput('data', Object.assign({}, defaultData, overrideData ?? {}));
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGroupComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  describe('Rendering', () => {
    it('should render one element per provided button', () => {
      const fixture = createButtonFixture({
        buttons: [
          { label: 'One', severity: 'primary', disabled: false, onClick: vi.fn() },
          { label: 'Two', severity: 'secondary', disabled: false, onClick: vi.fn() },
        ],
      });

      const buttons = fixture.nativeElement.querySelectorAll('jhi-button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Interaction', () => {
    it('should trigger the onClick handler of the clicked button', () => {
      const clickSpy = vi.fn();
      const fixture = createButtonFixture({
        buttons: [{ label: 'Click Me', severity: 'primary', disabled: false, onClick: clickSpy }],
      });

      const buttonEl = fixture.nativeElement.querySelector('jhi-button');
      buttonEl.click();

      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });
});
