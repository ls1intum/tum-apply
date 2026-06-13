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
import { RefereeRelationship } from 'app/generated/model/referee-relationship';
import { AcquaintanceDuration } from 'app/generated/model/acquaintance-duration';
import { AcquaintanceDepth } from 'app/generated/model/acquaintance-depth';
import { PeerRating } from 'app/generated/model/peer-rating';
import { OverallRecommendation } from 'app/generated/model/overall-recommendation';

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
    { name: 'reference.questions.relationship.capacity.options.courseInstructor', value: RefereeRelationship.CourseInstructor },
    { name: 'reference.questions.relationship.capacity.options.researchSupervisor', value: RefereeRelationship.ResearchSupervisor },
    { name: 'reference.questions.relationship.capacity.options.thesisAdvisor', value: RefereeRelationship.ThesisAdvisor },
    { name: 'reference.questions.relationship.capacity.options.employer', value: RefereeRelationship.Employer },
    { name: 'reference.questions.relationship.capacity.options.academicAdvisor', value: RefereeRelationship.AcademicAdvisor },
    { name: 'reference.questions.relationship.capacity.options.other', value: RefereeRelationship.Other },
  ];
  protected readonly durationOptions: SelectOption[] = [
    { name: 'reference.questions.relationship.duration.options.lessThanOneYear', value: AcquaintanceDuration.LessThanOneYear },
    { name: 'reference.questions.relationship.duration.options.oneToTwoYears', value: AcquaintanceDuration.OneToTwoYears },
    { name: 'reference.questions.relationship.duration.options.threeToFiveYears', value: AcquaintanceDuration.ThreeToFiveYears },
    { name: 'reference.questions.relationship.duration.options.moreThanFiveYears', value: AcquaintanceDuration.MoreThanFiveYears },
  ];
  protected readonly depthOptions: SelectOption[] = [
    { name: 'reference.questions.relationship.depth.options.casually', value: AcquaintanceDepth.Casually },
    { name: 'reference.questions.relationship.depth.options.moderately', value: AcquaintanceDepth.Moderately },
    { name: 'reference.questions.relationship.depth.options.well', value: AcquaintanceDepth.Well },
    { name: 'reference.questions.relationship.depth.options.veryWell', value: AcquaintanceDepth.VeryWell },
  ];
  protected readonly ratingOptions: SelectOption[] = [
    { name: 'reference.questions.rating.options.top1to2', value: PeerRating.TopOneToTwoPercent },
    { name: 'reference.questions.rating.options.top5', value: PeerRating.TopFivePercent },
    { name: 'reference.questions.rating.options.top10', value: PeerRating.TopTenPercent },
    { name: 'reference.questions.rating.options.top25', value: PeerRating.TopTwentyFivePercent },
    { name: 'reference.questions.rating.options.top50', value: PeerRating.TopFiftyPercent },
    { name: 'reference.questions.rating.options.belowAverage', value: PeerRating.BelowAverage },
    { name: 'reference.questions.rating.options.cannotJudge', value: PeerRating.CannotJudge },
  ];
  protected readonly overallOptions: SelectOption[] = [
    { name: 'reference.questions.overall.options.highestEnthusiasm', value: OverallRecommendation.HighestEnthusiasm },
    { name: 'reference.questions.overall.options.stronglyRecommend', value: OverallRecommendation.StronglyRecommend },
    { name: 'reference.questions.overall.options.recommend', value: OverallRecommendation.Recommend },
    { name: 'reference.questions.overall.options.recommendWithReservations', value: OverallRecommendation.RecommendWithReservations },
    { name: 'reference.questions.overall.options.doNotRecommend', value: OverallRecommendation.DoNotRecommend },
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
          a.relationship as RefereeRelationship,
          a.acquaintanceDuration as AcquaintanceDuration,
          a.acquaintanceDepth as AcquaintanceDepth,
          a.ratingIntellectualAbility as PeerRating,
          a.ratingResearchPotential as PeerRating,
          a.ratingMotivation as PeerRating,
          a.ratingCommunication as PeerRating,
          a.ratingLeadership as PeerRating,
          a.ratingCollaboration as PeerRating,
          a.overallRecommendation as OverallRecommendation,
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
