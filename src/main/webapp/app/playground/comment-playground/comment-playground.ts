import { Component } from '@angular/core';

import { Comment } from '../../shared/components/molecules/comment/comment';

@Component({
  selector: 'jhi-comment-playground',
  imports: [Comment],
  templateUrl: './comment-playground.html',
  styleUrl: './comment-playground.scss',
})
export class CommentPlayground {}
