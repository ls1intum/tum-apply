import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { CommentSection } from 'app/evaluation/components/comment-section/comment-section';
import { InternalCommentResourceApiService } from 'app/generated/api/internalCommentResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { AccountService } from 'app/core/auth/account.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

type CommentDTO = {
  commentId: string;
  message: string;
  authorName?: string;
};

describe('CommentSection', () => {
  let fixture: ComponentFixture<CommentSection>;
  let component: CommentSection;

  let mockCommentApi: {
    listComments: ReturnType<typeof vi.fn>;
    createComment: ReturnType<typeof vi.fn>;
    updateComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  };

  let mockToast: {
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCommentApi = {
      listComments: vi.fn(),
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    mockToast = {
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CommentSection],
      providers: [
        { provide: InternalCommentResourceApiService, useValue: mockCommentApi },
        { provide: ToastService, useValue: mockToast },
        { provide: AccountService, useValue: { user: () => ({ name: 'Alice Reviewer' }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CommentSection, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CommentSection);
    component = fixture.componentInstance;
  });

  it('should create component and set current user', () => {
    expect(component).toBeTruthy();
    expect(component['currentUser']).toBe('Alice Reviewer');
  });

  it('should clear draft and set comments [] when applicationId is undefined', async () => {
    fixture.componentRef.setInput('applicationId', undefined);
    fixture.detectChanges();
    await Promise.resolve();

    expect(component['comments']()).toEqual([]);
    expect(component['createDraft']()).toBe('');
    expect(mockCommentApi.listComments).not.toHaveBeenCalled();
  });

  it('should load comments when applicationId is defined', async () => {
    const data: CommentDTO[] = [{ commentId: 'c1', message: 'hello' }];
    mockCommentApi.listComments.mockReturnValueOnce(of(data));

    fixture.componentRef.setInput('applicationId', 'app-1');
    fixture.detectChanges();
    await Promise.resolve();

    expect(mockCommentApi.listComments).toHaveBeenCalledWith('app-1');
    expect(component['comments']()).toEqual(data);
    expect(component['createDraft']()).toBe('');
  });

  it('loadComments should early return when id undefined', async () => {
    fixture.componentRef.setInput('applicationId', undefined);
    fixture.detectChanges();

    await component.loadComments();
    expect(mockCommentApi.listComments).not.toHaveBeenCalled();
  });

  it('loadComments should set comments on success', async () => {
    const data: CommentDTO[] = [{ commentId: 'x', message: 'msg' }];
    mockCommentApi.listComments.mockReturnValueOnce(of(data));

    fixture.componentRef.setInput('applicationId', 'app-2');
    fixture.detectChanges();
    await component.loadComments();

    expect(component['comments']()).toEqual(data);
  });

  it('loadComments should show toast on error', async () => {
    mockCommentApi.listComments.mockReturnValueOnce(throwError(() => new Error('fail')));

    fixture.componentRef.setInput('applicationId', 'app-3');
    fixture.detectChanges();
    await component.loadComments();

    expect(mockToast.showError).toHaveBeenCalledWith({ summary: 'Error', detail: 'Failed to load comments' });
  });

  it('createComment should early return when id undefined', async () => {
    fixture.componentRef.setInput('applicationId', undefined);
    fixture.detectChanges();

    await component.createComment('hello');
    expect(mockCommentApi.createComment).not.toHaveBeenCalled();
  });

  it('createComment should early return when message is empty', async () => {
    fixture.componentRef.setInput('applicationId', 'app-4');
    fixture.detectChanges();

    await component.createComment('   ');
    expect(mockCommentApi.createComment).not.toHaveBeenCalled();
  });

  it('createComment should append created comment and clear draft', async () => {
    fixture.componentRef.setInput('applicationId', 'app-5');
    fixture.detectChanges();

    component['comments'].set([{ commentId: 'a', message: 'A' }]);
    mockCommentApi.createComment.mockReturnValueOnce(of({ commentId: 'b', message: 'B' }));

    await component.createComment('  B  ');

    expect(component['comments']()).toEqual([
      { commentId: 'a', message: 'A' },
      { commentId: 'b', message: 'B' },
    ]);
    expect(component['createDraft']()).toBe('');
  });

  it('createComment should show toast on error', async () => {
    fixture.componentRef.setInput('applicationId', 'app-6');
    fixture.detectChanges();

    mockCommentApi.createComment.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.createComment('msg');
    expect(mockToast.showError).toHaveBeenCalledWith({ summary: 'Error', detail: 'Failed to create comment' });
  });

  it('updateComment should early return when id missing', async () => {
    await component.updateComment('', 'text');
    expect(mockCommentApi.updateComment).not.toHaveBeenCalled();
  });

  it('updateComment should early return when message empty', async () => {
    await component.updateComment('c1', '   ');
    expect(mockCommentApi.updateComment).not.toHaveBeenCalled();
  });

  it('updateComment should replace comment on success', async () => {
    component['comments'].set([{ commentId: 'c1', message: 'old' }]);
    mockCommentApi.updateComment.mockReturnValueOnce(of({ commentId: 'c1', message: 'new' }));

    await component.updateComment('c1', 'new');

    expect(component['comments']()).toEqual([{ commentId: 'c1', message: 'new' }]);
  });

  it('updateComment should leave other comments unchanged when id does not match', async () => {
    component['comments'].set([
      { commentId: 'c1', message: 'first' },
      { commentId: 'c2', message: 'second' },
    ]);

    const updated: CommentDTO = { commentId: 'other', message: 'updated' };
    mockCommentApi.updateComment.mockReturnValueOnce(of(updated));

    await component.updateComment('other', 'updated');

    expect(component['comments']()).toEqual([
      { commentId: 'c1', message: 'first' },
      { commentId: 'c2', message: 'second' },
    ]);
  });

  it('updateComment should show toast on error', async () => {
    mockCommentApi.updateComment.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.updateComment('c1', 'msg');
    expect(mockToast.showError).toHaveBeenCalledWith({ summary: 'Error', detail: 'Failed to update comment' });
  });

  it('deleteComment should early return when id undefined', async () => {
    await component.deleteComment(undefined);
    expect(mockCommentApi.deleteComment).not.toHaveBeenCalled();
  });

  it('deleteComment should remove comment on success', async () => {
    component['comments'].set([
      { commentId: 'c1', message: 'one' },
      { commentId: 'c2', message: 'two' },
    ]);
    mockCommentApi.deleteComment.mockReturnValueOnce(of(void 0));

    await component.deleteComment('c1');
    expect(component['comments']()).toEqual([{ commentId: 'c2', message: 'two' }]);
  });

  it('deleteComment should show toast on error', async () => {
    mockCommentApi.deleteComment.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.deleteComment('c1');
    expect(mockToast.showError).toHaveBeenCalledWith({ summary: 'Error', detail: 'Failed to delete comment' });
  });

  it('refresh should delegate to loadComments', async () => {
    const spy = vi.spyOn(component, 'loadComments').mockResolvedValue(void 0);
    await component.refresh();
    expect(spy).toHaveBeenCalled();
  });
});
