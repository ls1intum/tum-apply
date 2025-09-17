import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchGroupInfoComponent } from './research-group-info.component';

describe('ResearchGroupInfo', () => {
  let component: ResearchGroupInfoComponent;
  let fixture: ComponentFixture<ResearchGroupInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchGroupInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
