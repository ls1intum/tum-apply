import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenderBiasAnalysisDialog } from './gender-bias-analysis-dialog';

describe('GenderBiasAnalysisDialog', () => {
  let component: GenderBiasAnalysisDialog;
  let fixture: ComponentFixture<GenderBiasAnalysisDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenderBiasAnalysisDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(GenderBiasAnalysisDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
