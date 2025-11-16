import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { DateSectionComponent } from 'app/interview/interview-process-detail/date-section/date-section.component';

interface GroupedSlots {
  date: string;
  localDate: Date;
  slots: InterviewSlotDTO[];
}

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    DateSectionComponent,
  ],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);

  private readonly TIMEZONE = 'Europe/Berlin';

  processId = signal<string | null>(null);
  slots = signal<InterviewSlotDTO[]>([]);
  loading = signal(true);
  error = signal(false);

  groupedSlots = computed<GroupedSlots[]>(() => {
    const slotsData = this.slots();
    if (!slotsData.length) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();

    slotsData.forEach(slot => {
      const localDate = new Date(slot.startDateTime!);
      const dateKey = localDate.toISOString().split('T')[0];

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(slot);
    });

    return Array.from(grouped.entries())
      .map(([dateKey, dateSlots]) => ({
        date: dateKey,
        localDate: new Date(dateKey),
        slots: dateSlots.sort((a, b) =>
          new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime()
        ),
      }))
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
  });

  currentMonth = computed(() => {
    const groups = this.groupedSlots();
    if (!groups.length) return '';

    return groups[0].localDate.toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    });
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);
      void this.loadSlots(id);
    }
  }

  private async loadSlots(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);

      const data = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId)
      );

      this.slots.set(data);
    } catch (error) {
      console.error('Failed to load interview slots', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/interviews.overview']);
  }

  openCreateSlotsModal(): void {
    console.log('Create slots modal - Issue #8');
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id) {
      await this.loadSlots(id);
    }
  }
}
