import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReferenceRequestDTO } from 'app/generated/model/reference-request-dto';
import { OverallRecommendation } from 'app/generated/model/overall-recommendation';
import TranslateDirective from 'app/shared/language/translate.directive';
import {
  DEPTH_OPTIONS,
  DURATION_OPTIONS,
  OVERALL_OPTIONS,
  RATING_OPTIONS,
  RATING_ROWS,
  RELATIONSHIP_OPTIONS,
  assessmentLabelKey,
} from 'app/reference/reference-assessment.constants';

/**
 * Read-only display of the structured assessment a referee submitted with their recommendation letter.
 * Renders one card per referee whose letter has been submitted; references without an assessment are
 * ignored so the section can be fed the full reference list.
 */
@Component({
  selector: 'jhi-reference-assessment-section',
  standalone: true,
  imports: [TranslateDirective],
  templateUrl: './reference-assessment-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceAssessmentSectionComponent {
  readonly assessments = input<ReferenceRequestDTO[]>([]);

  protected readonly ratingRows = RATING_ROWS;

  protected readonly submitted = computed(() => this.assessments().filter(reference => !!reference.overallRecommendation));

  /**
   * @param reference the referee's reference request
   * @returns the referee's display name (title, first and last name)
   */
  protected refereeName(reference: ReferenceRequestDTO): string {
    return [reference.title, reference.firstName, reference.lastName].filter(part => !!part).join(' ');
  }

  protected relationshipLabelKey(reference: ReferenceRequestDTO): string | undefined {
    return assessmentLabelKey(RELATIONSHIP_OPTIONS, reference.relationship);
  }

  protected durationLabelKey(reference: ReferenceRequestDTO): string | undefined {
    return assessmentLabelKey(DURATION_OPTIONS, reference.acquaintanceDuration);
  }

  protected depthLabelKey(reference: ReferenceRequestDTO): string | undefined {
    return assessmentLabelKey(DEPTH_OPTIONS, reference.acquaintanceDepth);
  }

  protected overallLabelKey(reference: ReferenceRequestDTO): string | undefined {
    return assessmentLabelKey(OVERALL_OPTIONS, reference.overallRecommendation);
  }

  /**
   * @param reference the referee's reference request
   * @param key the rating field name (one of {@link RATING_ROWS})
   * @returns the i18n label key for that rating's value
   */
  protected ratingLabelKey(reference: ReferenceRequestDTO, key: string): string | undefined {
    const value = (reference as unknown as Record<string, string | undefined>)[key];
    return assessmentLabelKey(RATING_OPTIONS, value);
  }

  /**
   * @param reference the referee's reference request
   * @returns a text colour class conveying the strength of the overall recommendation
   */
  protected overallSeverityClass(reference: ReferenceRequestDTO): string {
    switch (reference.overallRecommendation) {
      case OverallRecommendation.HighestEnthusiasm:
      case OverallRecommendation.StronglyRecommend:
        return 'text-positive-default';
      case OverallRecommendation.RecommendWithReservations:
        return 'text-warning-default';
      case OverallRecommendation.DoNotRecommend:
        return 'text-negative-default';
      default:
        return 'text-primary';
    }
  }
}
