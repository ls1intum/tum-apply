import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationDetailCardComponent } from './application-detail-card.component';

describe('ApplicationDetailCardComponent', () => {
  let component: ApplicationDetailCardComponent;
  let fixture: ComponentFixture<ApplicationDetailCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
