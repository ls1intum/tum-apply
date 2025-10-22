import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressStepperComponent } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';

describe('ProgressStepperComponent', () => {
    let component: ProgressStepperComponent;
    let fixture: ComponentFixture<ProgressStepperComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ProgressStepperComponent],
            providers: [],
        });

        fixture = TestBed.createComponent(ProgressStepperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
