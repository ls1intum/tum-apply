import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comment } from './comment';

describe('Comment', () => {
  let component: Comment;
  let fixture: ComponentFixture<Comment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comment],
    }).compileComponents();

    fixture = TestBed.createComponent(Comment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
