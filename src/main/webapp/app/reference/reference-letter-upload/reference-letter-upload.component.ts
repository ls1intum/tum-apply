import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ReferenceLetterUploadResourceApi } from 'app/generated/api/reference-letter-upload-resource-api';
import { ReferenceLetterUploadContextDTO } from 'app/generated/model/reference-letter-upload-context-dto';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';
import { ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';

type Relationship = 'COURSE_INSTRUCTOR' | 'RESEARCH_SUPERVISOR' | 'THESIS_ADVISOR' | 'EMPLOYER' | 'ACADEMIC_ADVISOR' | 'OTHER';
type Duration = 'LESS_THAN_ONE_YEAR' | 'ONE_TO_TWO_YEARS' | 'THREE_TO_FIVE_YEARS' | 'MORE_THAN_FIVE_YEARS';
type Depth = 'CASUALLY' | 'MODERATELY' | 'WELL' | 'VERY_WELL';
type Rating =
  | 'TOP_ONE_TO_TWO_PERCENT'
  | 'TOP_FIVE_PERCENT'
  | 'TOP_TEN_PERCENT'
  | 'TOP_TWENTY_FIVE_PERCENT'
  | 'TOP_FIFTY_PERCENT'
  | 'BELOW_AVERAGE'
  | 'CANNOT_JUDGE';
type Overall = 'HIGHEST_ENTHUSIASM' | 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'RECOMMEND_WITH_RESERVATIONS' | 'DO_NOT_RECOMMEND';

/**
 * Public landing page for external referees to fill in a structured assessment and upload a
 * recommendation letter.
 */
@Component({
  selector: 'jhi-reference-letter-upload',
  standalone: true,
  imports: [FontAwesomeModule, TranslateDirective, ButtonComponent, UploadButtonComponent, SelectComponent],
  templateUrl: './reference-letter-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceLetterUploadComponent {
  protected readonly documentType = DocumentInformationHolderDTODocumentTypeEnum.ReferenceLetter;
  protected readonly loading = signal<boolean>(true);
  protected readonly uploading = signal<boolean>(false);
  protected readonly errorKey = signal<string | undefined>(undefined);
  protected readonly justUploaded = signal<boolean>(false);

  protected readonly context = signal<ReferenceLetterUploadContextDTO | undefined>(undefined);
  protected uploadedDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  protected readonly queuedFile = signal<File | undefined>(undefined);
  protected readonly hasQueuedFile = computed(() => !!this.queuedFile());

  protected readonly relationshipOptions: SelectOption[] = [
    { name: 'reference.questions.relationship.capacity.options.courseInstructor', value: 'COURSE_INSTRUCTOR' },
    { name: 'reference.questions.relationship.capacity.options.researchSupervisor', value: 'RESEARCH_SUPERVISOR' },
    { name: 'reference.questions.relationship.capacity.options.thesisAdvisor', value: 'THESIS_ADVISOR' },
    { name: 'reference.questions.relationship.capacity.options.employer', value: 'EMPLOYER' },
    { name: 'reference.questions.relationship.capacity.options.academicAdvisor', value: 'ACADEMIC_ADVISOR' },
    { name: 'reference.questions.relationship.capacity.options.other', value: 'OTHER' },
  ];
  protected readonly durationOptions: SelectOption[] = [
    { name: 'reference.questions.relationship.duration.options.lessThanOneYear', value: 'LESS_THAN_ONE_YEAR' },
    { name: 'reference.questions.relationship.duration.options.oneToTwoYears', value: 'ONE_TO_TWO_YEARS' },
    { name: 'reference.questions.relationship.duration.options.threeToFiveYears', value: 'THREE_TO_FIVE_YEARS' },
    { name: 'reference.questions.relationship.duration.options.moreThanFiveYears', value: 'MORE_THAN_FIVE_YEARS' },
  ];
  protected readonly depthOptions: SelectOption[] = [
    { name: 'reference.questions.relationship.depth.options.casually', value: 'CASUALLY' },
    { name: 'reference.questions.relationship.depth.options.moderately', value: 'MODERATELY' },
    { name: 'reference.questions.relationship.depth.options.well', value: 'WELL' },
    { name: 'reference.questions.relationship.depth.options.veryWell', value: 'VERY_WELL' },
  ];
  protected readonly ratingOptions: SelectOption[] = [
    { name: 'reference.questions.rating.options.top1to2', value: 'TOP_ONE_TO_TWO_PERCENT' },
    { name: 'reference.questions.rating.options.top5', value: 'TOP_FIVE_PERCENT' },
    { name: 'reference.questions.rating.options.top10', value: 'TOP_TEN_PERCENT' },
    { name: 'reference.questions.rating.options.top25', value: 'TOP_TWENTY_FIVE_PERCENT' },
    { name: 'reference.questions.rating.options.top50', value: 'TOP_FIFTY_PERCENT' },
    { name: 'reference.questions.rating.options.belowAverage', value: 'BELOW_AVERAGE' },
    { name: 'reference.questions.rating.options.cannotJudge', value: 'CANNOT_JUDGE' },
  ];
  protected readonly overallOptions: SelectOption[] = [
    { name: 'reference.questions.overall.options.highestEnthusiasm', value: 'HIGHEST_ENTHUSIASM' },
    { name: 'reference.questions.overall.options.stronglyRecommend', value: 'STRONGLY_RECOMMEND' },
    { name: 'reference.questions.overall.options.recommend', value: 'RECOMMEND' },
    { name: 'reference.questions.overall.options.recommendWithReservations', value: 'RECOMMEND_WITH_RESERVATIONS' },
    { name: 'reference.questions.overall.options.doNotRecommend', value: 'DO_NOT_RECOMMEND' },
  ];
  protected readonly ratingRows: { key: string; labelKey: string }[] = [
    { key: 'ratingIntellectualAbility', labelKey: 'reference.questions.rating.rows.intellectualAbility' },
    { key: 'ratingResearchPotential', labelKey: 'reference.questions.rating.rows.researchPotential' },
    { key: 'ratingMotivation', labelKey: 'reference.questions.rating.rows.motivation' },
    { key: 'ratingCommunication', labelKey: 'reference.questions.rating.rows.communication' },
    { key: 'ratingLeadership', labelKey: 'reference.questions.rating.rows.leadership' },
    { key: 'ratingCollaboration', labelKey: 'reference.questions.rating.rows.collaboration' },
  ];

  protected readonly answers = signal<Record<string, string | undefined>>({});

  protected readonly allAnswered = computed(() => {
    const a = this.answers();
    return this.requiredKeys.every(key => a[key] !== undefined);
  });

  protected readonly canSubmit = computed(() => this.hasQueuedFile() && this.allAnswered() && !this.uploading());

  protected readonly expired = computed(() => this.context()?.status === ReferenceRequestDTOStatusEnum.Expired);

  protected readonly applicantFullName = computed(() => {
    const ctx = this.context();
    if (!ctx) {
      return '';
    }
    return [ctx.applicantFirstName, ctx.applicantLastName].filter(part => !!part).join(' ');
  });

  protected readonly alreadySubmitted = computed(
    () => this.context()?.status === ReferenceRequestDTOStatusEnum.Submitted || this.justUploaded(),
  );

  private readonly requiredKeys = [
    'relationship',
    'acquaintanceDuration',
    'acquaintanceDepth',
    'ratingIntellectualAbility',
    'ratingResearchPotential',
    'ratingMotivation',
    'ratingCommunication',
    'ratingLeadership',
    'ratingCollaboration',
    'overallRecommendation',
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReferenceLetterUploadResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  constructor() {
    void this.loadContext();
  }

  /**
   * Captures the file the referee picked.
   *
   * @param files the queued file list emitted by the upload button
   */
  protected onQueuedFilesChanged(files: File[]): void {
    this.queuedFile.set(files[0]);
  }

  /**
   * Records the referee's choice for a single structured question.
   *
   * @param key    the answer key (matches the upload request parameter name)
   * @param option the selected dropdown option
   */
  protected onAnswerSelected(key: string, option: SelectOption | undefined): void {
    this.answers.update(prev => ({ ...prev, [key]: option?.value as string | undefined }));
  }

  /**
   * Resolves the currently selected option for a question so the dropdown can render it.
   *
   * @param key     the answer key
   * @param options the option list the question is drawn from
   * @returns the matching option, or undefined when unanswered
   */
  protected selectedOption(key: string, options: SelectOption[]): SelectOption | undefined {
    const value = this.answers()[key];
    return options.find(option => option.value === value);
  }

  /**
   * Sends the staged file and structured answers to the upload endpoint and switches to the success
   * view. Stays on the upload view on failure so the referee can retry.
   */
  protected async confirmUpload(): Promise<void> {
    const file = this.queuedFile();
    if (!file || !this.allAnswered()) {
      return;
    }
    const a = this.answers();
    this.uploading.set(true);
    try {
      await firstValueFrom(
        this.api.upload(
          this.token,
          a.relationship as Relationship,
          a.acquaintanceDuration as Duration,
          a.acquaintanceDepth as Depth,
          a.ratingIntellectualAbility as Rating,
          a.ratingResearchPotential as Rating,
          a.ratingMotivation as Rating,
          a.ratingCommunication as Rating,
          a.ratingLeadership as Rating,
          a.ratingCollaboration as Rating,
          a.overallRecommendation as Overall,
          file,
        ),
      );
      this.justUploaded.set(true);
      this.toastService.showSuccessKey(`reference.uploadSuccess`);
    } catch {
      this.toastService.showErrorKey(`reference.uploadFailed`);
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * Loads the prefill context for the token from the server and stores it in the {@code context}
   * signal. Network or token-not-found failures populate {@code errorKey} so the template can
   * render an explanatory message instead of a blank page.
   */
  private async loadContext(): Promise<void> {
    if (!this.token) {
      this.errorKey.set(`reference.error.invalidLink`);
      this.loading.set(false);
      return;
    }
    try {
      const context = await firstValueFrom(this.api.getContext(this.token));
      this.context.set(context);
    } catch {
      this.errorKey.set(`reference.error.invalidLink`);
    } finally {
      this.loading.set(false);
    }
  }
}
