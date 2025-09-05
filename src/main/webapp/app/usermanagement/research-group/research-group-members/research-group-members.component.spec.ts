import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchGroupMembersComponent } from './research-group-members.component';

describe('ResearchGroupMembers', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
