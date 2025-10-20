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
            buttons: [{
                severity: 'primary',
                disabled: false,
                label: 'Button 1',
                onClick: vi.fn(),
            }],
        };

        fixture.componentRef.setInput('data', { ...defaultData, ...overrideData });
        fixture.detectChanges();
        return fixture;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ButtonGroupComponent],
            providers: [provideFontAwesomeTesting(), provideTranslateMock()],
        }).compileComponents();
    });

    it('should create a button group', () => {
        const fixture = createButtonFixture();
        expect(fixture.componentRef).toBeTruthy();
    });

    it('should render multiple buttons', () => {
        const fixture = createButtonFixture({
            buttons: [
                { label: 'One', severity: 'primary', disabled: false, onClick: vi.fn() },
                { label: 'Two', severity: 'secondary', disabled: false, onClick: vi.fn() },
            ],
        });

        const buttons = fixture.nativeElement.querySelectorAll('jhi-button');
        expect(buttons.length).toBe(2);
    });

    it('should apply vertical layout class when direction is vertical', () => {
        const fixture = createButtonFixture({ direction: 'vertical' });
        const container = fixture.nativeElement.querySelector('div');
        expect(container.className).toContain('flex-col');
    });

    it('should apply horizontal layout class when direction is horizontal', () => {
        const fixture = createButtonFixture({ direction: 'horizontal' });
        const container = fixture.nativeElement.querySelector('div');
        expect(container.className).toContain('flex-row');
    });

    it('should apply full width class when fullWidth is true', () => {
        const fixture = createButtonFixture({ fullWidth: true });
        const container = fixture.nativeElement.querySelector('div');
        expect(container.className).toContain('button-group-full-width');
    });


    it('should trigger button onClick handler when clicked', () => {
        const clickSpy = vi.fn();
        const fixture = createButtonFixture({
            buttons: [{ label: 'Click Me', severity: 'primary', disabled: false, onClick: clickSpy }],
        });

        const buttonEl = fixture.nativeElement.querySelector('jhi-button');
        buttonEl.click();

        expect(clickSpy).toHaveBeenCalled();
    });
});
