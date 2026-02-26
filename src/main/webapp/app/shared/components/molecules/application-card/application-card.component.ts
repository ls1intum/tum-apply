import { convertLikertToStandardRating } from 'app/shared/util/rating.util';
import { Component, computed, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import { DividerModule } from 'primeng/divider';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { StarRatingComponent } from 'app/shared/components/atoms/star-rating/star-rating.component';
import { getInitials } from 'app/shared/util/util';
import { toSignal } from '@angular/core/rxjs-interop';
import { formatGradeWithTranslation } from 'app/core/util/grade-conversion';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-application-card',
  imports: [FontAwesomeModule, TagComponent, TranslateModule, DividerModule, StarRatingComponent, TooltipModule],
  templateUrl: './application-card.component.html',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class ApplicationCardComponent {
  disabled = input<boolean>(false);
  placeholder = input<boolean>(false);
  application = input<ApplicationEvaluationDetailDTO | undefined>(undefined);

  readonly applicationDetails = computed<ApplicationDetailDTO | undefined>(() => {
    const application = this.application();
    if (application) {
      return application.applicationDetailDTO;
    }
    return undefined;
  });

  readonly stateSeverityMap: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
    INTERVIEW: 'info',
  };

  readonly nameParts = computed<{ first: string; last: string }>(() => {
    const fullName = this.application()?.applicationDetailDTO.applicant?.user.name?.trim() ?? '';
    const parts = fullName.split(' ').filter(p => p.length > 0);

    if (parts.length <= 2) {
      return { first: fullName, last: '' };
    }

    const last = parts.pop() ?? '';
    const first = parts.join(' ');
    return { first, last };
  });

  readonly initials = computed<string>(() => {
    const fullName = this.application()?.applicationDetailDTO.applicant?.user.name?.trim();
    return getInitials(fullName ?? '');
  });

  /**
   * Converts the average rating from Likert scale (-2 to +2) to standard 1-5 scale
   */
  readonly displayRating = computed<number | undefined>(() => {
    const avgRating = this.application()?.averageRating;
    if (avgRating === undefined) {
      return undefined;
    }
    return convertLikertToStandardRating(avgRating);
  });

  /**
   * Dynamic font size for applicant name based on length
   */
  readonly nameFontSize = computed<string>(() => {
    const name = this.application()?.applicationDetailDTO.applicant?.user.name ?? '';
    if (name.length > 40) return 'text-sm';
    if (name.length > 30) return 'text-base';
    return 'text-lg';
  });

  /**
   * Dynamic font size for job title based on length
   */
  readonly jobFontSize = computed<string>(() => {
    const jobTitle = this.applicationDetails()?.jobTitle ?? '';
    if (jobTitle.length > 60) return 'text-xs';
    if (jobTitle.length > 40) return 'text-sm';
    return 'text-sm';
  });

  readonly translateService = inject(TranslateService);
  currentLang = toSignal(this.translateService.onLangChange);

  readonly masterSummary = computed(() => {
    const applicant = this.applicationDetails()?.applicant;
    this.currentLang();

    return {
      degree: applicant?.masterDegreeName,
      university: applicant?.masterUniversity,
      gradeInfo: formatGradeWithTranslation(
        applicant?.masterGrade,
        applicant?.masterGradeUpperLimit,
        applicant?.masterGradeLowerLimit,
        this.translateService,
      ),
    };
  });
}
