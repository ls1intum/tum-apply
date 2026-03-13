import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs/esm';
import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/interview-process-card.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import { InterviewResourceApiService } from 'app/generated';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { MonthNavigationComponent } from 'app/interview/interview-process-detail/slots-section/month-navigation/month-navigation.component';
import { DateHeaderComponent } from 'app/interview/interview-process-detail/slots-section/date-header/date-header.component';
import { getLocale } from 'app/shared/util/date-time.util';
import { BREAKPOINTS } from 'app/shared/constants/breakpoints';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { UpcomingInterviewCardComponent } from './upcoming-interviews-widget/upcoming-interview-card/upcoming-interview-card.component';

interface GroupedUpcomingInterviews {
  date: string;
  localDate: Date;
  interviews: UpcomingInterviewDTO[];
}

@Component({
  selector: 'jhi-interview-processes-overview',
  imports: [
    TranslateModule,
    TranslateDirective,
    InterviewProcessCardComponent,
    UpcomingInterviewCardComponent,
    InfoBoxComponent,
    MonthNavigationComponent,
    DateHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent {
  // Signals
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  upcomingInterviews = signal<UpcomingInterviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);

  // Computed
  datesPerPage = computed(() => this.breakpointState());
  targetDate = computed(() => dayjs().add(this.currentMonthOffset(), 'month'));

  currentMonth = computed(() => {
    return this.targetDate().toDate().toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    });
  });

  groupedUpcomingInterviews = computed<GroupedUpcomingInterviews[]>(() => {
    const interviews = this.upcomingInterviews();
    if (!interviews.length) return [];

    const targetYear = this.targetDate().year();
    const targetMonth = this.targetDate().month();

    const grouped = new Map<string, UpcomingInterviewDTO[]>();

    for (const interview of interviews) {
      if (interview.startDateTime == null) continue;
      const date = dayjs(interview.startDateTime);

      // Only show interviews for the current selected month
      if (date.year() === targetYear && date.month() === targetMonth) {
        const dateKey = date.format('YYYY-MM-DD');
        const list = grouped.get(dateKey) ?? [];
        list.push(interview);
        grouped.set(dateKey, list);
      }
    }

    return Array.from(grouped.entries())
      .map(([dateKey, data]) => ({
        date: dateKey,
        localDate: dayjs(dateKey).toDate(),
        interviews: data.sort((a, b) => dayjs(a.startDateTime).valueOf() - dayjs(b.startDateTime).valueOf()),
      }))
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  });

  paginatedInterviews = computed(() => {
    const groups = this.groupedUpcomingInterviews();
    const pageSize = this.datesPerPage();
    const page = this.currentDatePage();
    const start = page * pageSize;
    return groups.slice(start, start + pageSize);
  });

  totalDatePages = computed(() => Math.ceil(this.groupedUpcomingInterviews().length / this.datesPerPage()));
  canGoPreviousDate = computed(() => this.currentDatePage() > 0);
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  // Constants
  private readonly DEFAULT_DATES_PER_PAGE = 5;

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);
  private readonly currentLangSignal = signal(this.translateService.getBrowserCultureLang());

  private readonly breakpointState = toSignal(
    this.breakpointObserver
      .observe([
        `(min-width: ${BREAKPOINTS.ultraWide}px)`,
        '(min-width: 1700px)',
        `(min-width: ${BREAKPOINTS.xl}px)`,
        `(min-width: ${BREAKPOINTS.lg}px)`,
      ])
      .pipe(
        map(result => {
          if (result.matches) {
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.ultraWide}px)`]) return 5;
            if (result.breakpoints['(min-width: 1700px)']) return 4;
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.xl}px)`]) return 3;
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.lg}px)`]) return 2;
          }
          return 1;
        }),
      ),
    { initialValue: this.DEFAULT_DATES_PER_PAGE },
  );

  private readonly locale = computed(() => {
    this.currentLangSignal();
    return getLocale(this.translateService);
  });

  // Effects
  constructor() {
    void this.loadData();

    effect(() => {
      const langEvent = this.langChangeSignal();
      if (langEvent?.lang !== undefined) {
        untracked(() => this.currentLangSignal.set(langEvent.lang));
      }
    });

    effect(
      () => {
        this.datesPerPage();
        untracked(() => this.currentDatePage.set(0));
      },
      { allowSignalWrites: true },
    );
  }

  // Public Methods
  previousMonth(): void {
    this.currentMonthOffset.update(offset => offset - 1);
    this.currentDatePage.set(0);
  }

  nextMonth(): void {
    this.currentMonthOffset.update(offset => offset + 1);
    this.currentDatePage.set(0);
  }

  previousDatePage(): void {
    if (this.canGoPreviousDate()) {
      this.currentDatePage.update(p => p - 1);
    }
  }

  nextDatePage(): void {
    if (this.canGoNextDate()) {
      this.currentDatePage.update(p => p + 1);
    }
  }

  viewDetails(jobId: string): void {
    const process = this.interviewProcesses().find(p => p.jobId === jobId);
    if (process?.processId != null) {
      void this.router.navigate(['/interviews', process.processId], {
        state: { jobTitle: process.jobTitle },
      });
    }
  }

  // Private Methods
  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      const [overviewData, upcomingData] = await Promise.all([
        firstValueFrom(this.interviewService.getInterviewOverview()),
        firstValueFrom(this.interviewService.getUpcomingInterviews()),
      ]);
      const processesWithImages = overviewData.map((process, index) => ({
        ...process,
        imageUrl: process.imageUrl ?? this.getExampleImageUrl(index),
      }));
      this.interviewProcesses.set(processesWithImages);
      this.upcomingInterviews.set(upcomingData);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private getExampleImageUrl(index: number): string {
    const headerImages = [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
    ];
    return headerImages[index % headerImages.length];
  }
}
