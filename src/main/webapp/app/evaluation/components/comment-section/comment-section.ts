import { Component, WritableSignal, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { InternalCommentDTO, InternalCommentResourceService } from '../../../generated';
import { AccountService, User } from '../../../core/auth/account.service';
import { ToastService } from '../../../service/toast-service';
import { Comment } from '../../../shared/components/molecules/comment/comment';
import TranslateDirective from '../../../shared/language/translate.directive';

@Component({
  selector: 'jhi-comment-section',
  imports: [Comment, TranslateDirective],
  templateUrl: './comment-section.html',
})
export class CommentSection {
  commentService = inject(InternalCommentResourceService);
  accountService = inject(AccountService);
  toast = inject(ToastService);

  applicationId = input.required<string | undefined>();

  protected comments = signal<InternalCommentDTO[]>([]);
  protected createDraft = signal<string>('');
  protected currentUser: WritableSignal<User | undefined> = this.accountService.user;
  protected editingId = signal<string | undefined>(undefined);

  protected _loadCommentsEffect = effect(() => {
    const id = this.applicationId();
    this.createDraft.set('');
    if (id !== undefined) {
      void this.loadComments();
    } else {
      this.comments.set([]);
    }
  });

  async loadComments(): Promise<void> {
    const id = this.applicationId();
    if (id === undefined) {
      return;
    }
    try {
      const data = await firstValueFrom(this.commentService.listComments(id));
      this.comments.set(data);
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to load comments' });
    }
  }

  async createComment(message: string): Promise<void> {
    const id = this.applicationId();
    const trimmed = message.trim();
    if (id === undefined || !trimmed) return;

    try {
      const created = await firstValueFrom(this.commentService.createComment(id, { message: trimmed }));
      this.comments.update(prev => [...prev, created]);
      this.createDraft.set('');
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to create comment' });
    }
  }

  async updateComment(commentId: string, message: string): Promise<void> {
    const trimmed = message.trim();
    if (!commentId || !trimmed) return;

    try {
      const updated = await firstValueFrom(this.commentService.updateComment(commentId, { message: trimmed }));
      this.comments.update(prev => prev.map(c => (c.commentId === commentId ? updated : c)));
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to update comment' });
    }
  }

  async deleteComment(commentId: string | undefined): Promise<void> {
    if (commentId === undefined) return;

    try {
      await firstValueFrom(this.commentService.deleteComment(commentId));
      this.comments.update(prev => prev.filter(c => c.commentId !== commentId));
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to delete comment' });
    }
  }

  async refresh(): Promise<void> {
    await this.loadComments();
  }
}
