import { Component, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { Comment } from 'app/shared/components/molecules/comment/comment';
import { InternalCommentResourceApi } from 'app/generated/api/internal-comment-resource-api';
import { InternalCommentDTO } from 'app/generated/model/internal-comment-dto';
import { RatingResourceApi } from 'app/generated/api/rating-resource-api';
import { RatingDTO } from 'app/generated/model/rating-dto';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-comment-section',
  imports: [Comment, TranslateDirective],
  templateUrl: './comment-section.html',
})
export class CommentSection {
  commentApi = inject(InternalCommentResourceApi);
  ratingApi = inject(RatingResourceApi);
  accountService = inject(AccountService);
  toast = inject(ToastService);

  applicationId = input.required<string | undefined>();

  protected comments = signal<InternalCommentDTO[]>([]);
  protected otherRatings = signal<RatingDTO[]>([]);
  protected currentUserRating = signal<number | undefined>(undefined);
  protected createDraft = signal<string>('');
  protected currentUser = this.accountService.loadedUser()?.name ?? '';
  protected editingId = signal<string | undefined>(undefined);

  protected _loadCommentsEffect = effect(() => {
    const id = this.applicationId();
    this.createDraft.set('');
    if (id !== undefined) {
      void this.loadComments();
      void this.loadOtherRatings(id);
    } else {
      this.comments.set([]);
      this.otherRatings.set([]);
      this.currentUserRating.set(undefined);
    }
  });

  ratingForAuthor(author: string): number | undefined {
    if (author === this.currentUser) {
      return this.currentUserRating();
    }
    return this.otherRatings().find(r => r.from === author)?.rating;
  }

  async loadOtherRatings(applicationId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.ratingApi.getRatings(applicationId));
      this.otherRatings.set(data.otherRatings ?? []);
      this.currentUserRating.set(data.currentUserRating ?? undefined);
    } catch {
      this.toast.showError({ summary: 'Error', detail: 'Failed to load comment ratings' });
    }
  }

  async loadComments(): Promise<void> {
    const id = this.applicationId();
    if (id === undefined) {
      return;
    }
    try {
      const data = await firstValueFrom(this.commentApi.listComments(id));
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

  async refresh(): Promise<void> {
    await this.loadComments();
  }
}
