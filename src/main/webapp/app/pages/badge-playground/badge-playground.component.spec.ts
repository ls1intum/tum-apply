import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgePlaygroundComponent } from './badge-playground.component';

describe('BadgePlaygroundComponent', () => {
  let component: BadgePlaygroundComponent;
  let fixture: ComponentFixture<BadgePlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgePlaygroundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgePlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
