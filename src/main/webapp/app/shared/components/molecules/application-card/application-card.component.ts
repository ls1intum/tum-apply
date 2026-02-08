import { convertLikertToStandardRating } from 'app/shared/util/rating.util';
import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { DividerModule } from 'primeng/divider';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { StarRatingComponent } from 'app/shared/components/atoms/star-rating/star-rating.component';

@Component({
  selector: 'jhi-application-card',
  imports: [FontAwesomeModule, TagComponent, TranslateModule, LocalizedDatePipe, DividerModule, StarRatingComponent],
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
    if (!fullName) {
      return '?';
    }
    const nameParts = fullName.split(' ').filter(p => p.length > 0);
    if (nameParts.length === 0) {
      return '?';
    }
    const firstInitial = nameParts[0]?.charAt(0)?.toUpperCase() || '';
    const lastInitial = nameParts[nameParts.length - 1]?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  });

  readonly masterDegree = computed(() => {
    const applicant = this.applicationDetails()?.applicant;
    if (!applicant) {
      return null;
    }
    const degreeName = applicant.masterDegreeName;
    const university = applicant.masterUniversity;
    if (degreeName === undefined && university === undefined) {
      return null;
    }
    return {
      name: degreeName ?? '—',
      university: university ?? '—',
      grade: applicant.masterGrade ?? '—',
    };
  });

  /**
   * Converts the average rating from Likert scale (-2 to +2) to standard 1-5 scale
   */
  readonly displayRating = computed<number | undefined>(() => {
    const avgRating = this.application()?.averageRating;
    if (avgRating === null || avgRating === undefined) {
      return undefined;
    }
    return convertLikertToStandardRating(avgRating);
  });
}
