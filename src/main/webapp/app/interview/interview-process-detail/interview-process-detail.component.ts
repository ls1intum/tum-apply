import { Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { getInterviewProcessDetailsResource } from 'app/generated/api/interview-resource-api';
import { JobDetailDTOStateEnum } from 'app/generated/model/job-detail-dto';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { IntervieweeSectionComponent } from 'app/interview/interview-process-detail/interviewee-section/interviewee-section.component';

import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [TranslateModule, BackButtonComponent, TagComponent, SlotsSectionComponent, IntervieweeSectionComponent],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  processId = signal<string | undefined>(undefined);
  readonly safeProcessId = computed(() => this.processId() ?? '');

  // Resource for process details
  private readonly processDetailsResource = getInterviewProcessDetailsResource(this.safeProcessId);

  jobTitle = computed(() => this.processDetailsResource.value()?.jobTitle);
  jobId = computed(() => this.processDetailsResource.value()?.jobId);
  jobState = computed(() => this.processDetailsResource.value()?.jobState);
  readonly safeJobTitle = computed(() => this.jobTitle() ?? '');
  readonly isJobClosed = computed(
    () => this.jobState() === JobDetailDTOStateEnum.Closed || this.jobState() === JobDetailDTOStateEnum.ApplicantFound,
  );

  // Signal to trigger interviewee section reload
  intervieweeRefreshKey = signal(0);
  // Signal to trigger slots section reload
  slotsRefreshKey = signal(0);
  invitedCount = computed(() => this.processDetailsResource.value()?.invitedCount ?? 0);
  hasSlots = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  private readonly updateTitleEffect = effect(() => {
    const title = this.jobTitle();
    if (title !== undefined && title !== '') {
      this.updateTabTitle(title);
    }
  });

  private readonly location = inject(Location);

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId') ?? undefined;
    if (id !== undefined && id !== '') {
      this.processId.set(id);
    }
  }

  onSlotAssigned(): void {
    this.intervieweeRefreshKey.update(currentKey => currentKey + 1);
  }

  onSlotCancelled(): void {
    this.slotsRefreshKey.update(k => k + 1);
  }

  private updateTabTitle(jobTitle: string): void {
    this.titleService.setTitle(`Interview – ${jobTitle}`);
  }
}
