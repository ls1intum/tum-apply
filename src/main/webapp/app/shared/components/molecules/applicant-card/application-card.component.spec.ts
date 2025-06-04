import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';

import { ApplicationEvaluationOverviewDTO } from '../../../../generated';

import { ApplicationCardComponent } from './application-card.component';

@Component({
  selector: 'jhi-tag',
  standalone: true,
  template: '<span class="mock-tag">{{ text() }} - {{ color() }}</span>',
})
class MockTagComponent {
  text = signal('');
  color = signal('');
}

@Component({
  selector: 'jhi-rating',
  standalone: true,
  template: '<div class="mock-rating">{{ rating() }}</div>',
})
class MockRatingComponent {
  rating = signal<number | null>(null);
}

@Component({
  selector: 'jhi-button',
  standalone: true,
  template: '<button [disabled]="disabled()">{{ label() }}</button>',
})
class MockButtonComponent {
  label = signal('');
  disabled = signal(false);
  variant = signal('');
}

describe('ApplicationCardComponent', () => {
  let fixture: ComponentFixture<ApplicationCardComponent>;
  let component: ApplicationCardComponent;

  const mockApplication: ApplicationEvaluationOverviewDTO = {
    name: 'Lukas Meier',
    jobName: 'AI Systems Research',
    state: 'ACCEPTED',
    rating: 4,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCardComponent, MockTagComponent, MockRatingComponent, MockButtonComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('application', mockApplication);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders name and job title', () => {
    const nameEl = fixture.debugElement.query(By.css('.name')).nativeElement;
    const jobEl = fixture.debugElement.query(By.css('.job-title')).nativeElement;

    expect(nameEl.textContent).toContain('Lukas Meier');
    expect(jobEl.textContent).toContain('AI Systems Research');
  });

  it('renders disabled buttons when `disabled` is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons.forEach(button => expect((button.nativeElement as HTMLButtonElement).disabled).toBe(true));
  });

  it('omits the rating component when `rating` is undefined', () => {
    fixture.componentRef.setInput('application', { ...mockApplication, rating: undefined });
    fixture.detectChanges();

    const ratingDe = fixture.debugElement.query(By.css('.mock-rating'));
    expect(ratingDe).toBeNull();
  });
});
