import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { Comment } from 'app/shared/components/molecules/comment/comment';
import { InternalCommentResourceApi, listCommentsResource } from 'app/generated/api/internal-comment-resource-api';
import { InternalCommentDTO } from 'app/generated/model/internal-comment-dto';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-comment-section',
  imports: [Comment, TranslateDirective],
  templateUrl: './comment-section.html',
})
export class CommentSection {
  commentApi = inject(InternalCommentResourceApi);
  accountService = inject(AccountService);
  toast = inject(ToastService);

  applicationId = input.required<string | undefined>();

  protected comments = signal<InternalCommentDTO[]>([]);
  protected createDraft = signal<string>('');
  protected currentUser = this.accountService.loadedUser()?.name ?? '';
  protected editingId = signal<string | undefined>(undefined);

  private safeApplicationId = computed(() => this.applicationId() ?? '');
  private commentsResource = listCommentsResource(this.safeApplicationId);

  protected _loadCommentsEffect = effect(() => {
    const id = this.applicationId();
    this.createDraft.set('');
    if (id !== undefined) {
      const data = this.commentsResource.value();
      if (data) {
        this.comments.set(data);
      } else if (this.commentsResource.error()) {
        this.toast.showError({ summary: 'Error', detail: 'Failed to load comments' });
      }
    } else {
      this.comments.set([]);
    }
  });

  async createComment(message: string): Promise<void> {
    const id = this.applicationId();
    const trimmed = message.trim();
    if (id === undefined || !trimmed) return;

    try {
      const created = await firstValueFrom(this.commentApi.createComment(id, { message: trimmed }));
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
      const updated = await firstValueFrom(this.commentApi.updateComment(commentId, { message: trimmed }));
      this.comments.update(prev => prev.map(c => (c.commentId === commentId ? updated : c)));
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to update comment' });
    }
  }

  async deleteComment(commentId: string | undefined): Promise<void> {
    if (commentId === undefined) return;

    try {
      await firstValueFrom(this.commentApi.deleteComment(commentId));
      this.comments.update(prev => prev.filter(c => c.commentId !== commentId));
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to delete comment' });
    }
  }

  refresh(): void {
    this.commentsResource.reload();
  }
}
