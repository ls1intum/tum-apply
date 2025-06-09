import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationSectionComponent } from './information-section.component';

describe('InformationSectionComponent', () => {
  let component: InformationSectionComponent;
  let fixture: ComponentFixture<InformationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
