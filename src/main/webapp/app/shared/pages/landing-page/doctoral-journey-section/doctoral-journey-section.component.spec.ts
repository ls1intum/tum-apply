import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctoralJourneySectionComponent } from './doctoral-journey-section.component';

describe('DoctoralJourneySectionComponent', () => {
  let component: DoctoralJourneySectionComponent;
  let fixture: ComponentFixture<DoctoralJourneySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctoralJourneySectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctoralJourneySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
