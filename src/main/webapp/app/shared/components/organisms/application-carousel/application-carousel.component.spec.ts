import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationCarouselComponent } from './application-carousel.component';

describe('ApplicationCarouselComponent', () => {
  let component: ApplicationCarouselComponent;
  let fixture: ComponentFixture<ApplicationCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
