import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DividerModule } from 'primeng/divider';
import { InterviewResourceApi, getIntervieweeDetailsResource } from 'app/generated/api/interview-resource-api';
import { IntervieweeDetailDTO } from 'app/generated/model/interviewee-detail-dto';
import { UpdateAssessmentDTO } from 'app/generated/model/update-assessment-dto';
import { ToastService } from 'app/service/toast-service';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { Section } from 'app/shared/components/atoms/section/section';
import { RatingComponent } from 'app/shared/components/atoms/rating/rating.component';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { DocumentSection } from 'app/shared/components/organisms/document-section/document-section';
import { Prose } from 'app/shared/components/atoms/prose/prose';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { formatFullName } from 'app/shared/util/name.util';

/**
 * Assessment view for evaluating interview candidates.
 * Supports auto-saving ratings and manual notes editing with optimistic UI updates.
 */
@Component({
  selector: 'jhi-interviewee-assessment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TranslateDirective,
    FontAwesomeModule,
    DividerModule,
    BackButtonComponent,
    ButtonComponent,
    Section,
    RatingComponent,
    EditorComponent,
    DocumentSection,
    Prose,
    UserAvatarComponent,
  ],
  templateUrl: './interviewee-assessment.component.html',
})
export class IntervieweeAssessmentComponent {
  // Signals
  protected readonly interviewee = signal<IntervieweeDetailDTO | undefined>(undefined);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly rating = signal<number | undefined>(undefined);
  protected readonly notesControl = new FormControl<string>('', { nonNullable: true });

  protected readonly saving = signal<boolean>(false);
  protected readonly params = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly queryParamsSignal = toSignal(inject(ActivatedRoute).queryParams);

  // Computed
  protected readonly processId = computed(() => this.params()?.get('processId') ?? '');
  protected readonly intervieweeId = computed(() => this.params()?.get('intervieweeId') ?? '');

  // Resource
  private readonly intervieweeResource = getIntervieweeDetailsResource(this.processId, this.intervieweeId);

  protected readonly applicantName = computed(() => {
    const user = this.interviewee()?.user;
    if (!user) return '';
    return formatFullName(user.firstName, user.lastName);
  });
  protected readonly applicantAvatar = computed(() => this.interviewee()?.user?.avatar);

  protected readonly degreeName = computed(() => {
    const applicant = this.interviewee()?.application?.applicant;
    if (!applicant) return '';
    return applicant.masterDegreeName ?? '';
  });

  protected readonly universityName = computed(() => {
    const applicant = this.interviewee()?.application?.applicant;
    if (!applicant) return '';
    return applicant.masterUniversity ?? '';
  });

  // Extracts motivation text from nested application DTO
  protected readonly motivation = computed(() => this.interviewee()?.application?.motivation ?? '');
  protected readonly skills = computed(() => this.interviewee()?.application?.specialSkills ?? '');

  // Extracts projects/interests from nested application DTO
  protected readonly interests = computed(() => this.interviewee()?.application?.projects ?? '');

  // Returns document IDs for document-section component
  protected readonly documentIds = computed(() => this.interviewee()?.documents);

  // Returns persisted notes (not current editor value)
  protected readonly savedNotes = computed(() => this.interviewee()?.assessmentNotes ?? '');

  // Returns application ID as string for child components
  protected readonly applicationId = computed(() => this.interviewee()?.applicationId?.toString());

  // Returns scheduled slot info if available
  protected readonly slotInfo = computed(() => this.interviewee()?.scheduledSlot);

  // Services
  private readonly router = inject(Router);
  private readonly interviewApi = inject(InterviewResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly serverRating = signal<number | undefined>(undefined);
  private readonly isInitializing = signal<boolean>(true);

  // Effects
  // React to resource loading state
  private readonly resourceLoadingEffect = effect(() => {
    this.loading.set(this.intervieweeResource.isLoading());
  });

  // React to resource data
  private readonly resourceDataEffect = effect(() => {
    const data = this.intervieweeResource.value();
    if (data) {
      this.isInitializing.set(true);
      this.interviewee.set(data);
      this.rating.set(data.rating ?? undefined);
      this.serverRating.set(data.rating ?? undefined);
      this.notesControl.setValue(data.assessmentNotes ?? '', { emitEvent: false });
      this.error.set(undefined);
      this.isInitializing.set(false);
    }
  });

  // React to resource errors
  private readonly resourceErrorEffect = effect(() => {
    const err = this.intervieweeResource.error();
    if (err != null) {
      this.handleLoadError(err);
    }
  });

  private readonly ratingSaveEffect = effect(() => {
    const rating = this.rating();
    const processId = this.processId();
    const intervieweeId = this.intervieweeId();

    if (this.isInitializing()) return;
    if (rating === this.serverRating()) return;
    if (!processId || !intervieweeId) return;

    void this.saveRating(processId, intervieweeId, rating);
  });

  async saveNotes(): Promise<void> {
    const processId = this.processId();
    const intervieweeId = this.intervieweeId();
    const notes = this.notesControl.value;

    if (!processId || !intervieweeId) return;

    this.saving.set(true);

    const dto: UpdateAssessmentDTO = { notes };

    try {
      const updated = await firstValueFrom(this.interviewApi.updateAssessment(processId, intervieweeId, dto));

      this.interviewee.set(updated);
      this.toastService.showSuccessKey('interview.assessment.notes.saved');
    } catch {
      this.toastService.showErrorKey('interview.assessment.error.saveFailed');
    } finally {
      this.saving.set(false);
    }
  }

  // Navigates to process detail or overview fallback
  goBack(): void {
    const processId = this.processId();
    if (this.queryParamsSignal()?.from === 'overview') {
      void this.router.navigate(['/interviews/overview']);
      return;
    }

    if (processId) {
      void this.router.navigate(['/interviews', processId]);
    } else {
      void this.router.navigate(['/interviews/overview']);
    }
  }

  private async saveRating(processId: string, intervieweeId: string, rating: number | undefined): Promise<void> {
    const dto: UpdateAssessmentDTO = rating === undefined ? { clearRating: true } : { rating };

    try {
      await firstValueFrom(this.interviewApi.updateAssessment(processId, intervieweeId, dto));
      this.serverRating.set(rating);
    } catch {
      this.toastService.showErrorKey('interview.assessment.error.saveFailed');
      this.rating.set(this.serverRating());
    }
  }

  // Maps HTTP status codes to user-facing error keys
  private handleLoadError(err: unknown): void {
    const httpError = err as { status?: number };

    if (httpError.status === 404) {
      this.error.set('interview.assessment.error.notFound');
    } else if (httpError.status === 403) {
      this.toastService.showErrorKey('interview.assessment.error.loadFailed');
      void this.router.navigate(['/interviews/overview']);
    } else {
      this.error.set('interview.assessment.error.loadFailed');
      this.toastService.showErrorKey('interview.assessment.error.loadFailed');
    }
  }
}
